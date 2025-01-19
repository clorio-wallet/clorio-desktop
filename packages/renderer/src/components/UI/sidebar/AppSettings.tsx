import {useContext, useState} from 'react';
import {DEFAULT_QUERY_REFRESH_INTERVAL, storeSession, trimMiddle} from '/@/tools';
import Avatar from '/@/tools/avatar/avatar';
import MnemonicAccountSelection from '../modals/accountSelection/MnemonicAccountSelection';
import {IBalanceContext} from '/@/contexts/balance/BalanceTypes';
import {BalanceContext} from '/@/contexts/balance/BalanceContext';
import {IBalanceQueryResult} from '../../balance/BalanceTypes';
import {GET_BALANCE, GET_ID} from '/@/graphql/query';
import {useLazyQuery} from '@apollo/client';
import {IWalletIdData} from '/@/types';
import {useNavigate} from 'react-router-dom';
import {ModalContainer} from '../modals';
import NetworkSettings from './NetworkSettings';
import {renderNetworkLabel} from './SidebarHelper';
import {Repeat} from 'react-feather';
import {walletState} from '/@/store';
import {useRecoilState} from 'recoil';
import {QrCodeReader} from '../../QRCode/QrCodeReaderModal';

export default function AppSettings({
  toggleLoader,
  logout,
  lockSession,
  statusDot,
  network,
}: any | {toggleLoader: (state?: boolean) => void}) {
  const [showModal, setShowModal] = useState(false);
  const [wallet, updateWallet] = useRecoilState(walletState);
  const {address, mnemonic: isUsingMnemonic} = wallet;
  const {addBalance, shouldBalanceUpdate, setShouldBalanceUpdate} =
    useContext<Partial<IBalanceContext>>(BalanceContext);

  const [fetchWalletID] = useLazyQuery<IWalletIdData>(GET_ID, {
    variables: {publicKey: address, skip: !address},
  });
  const navigate = useNavigate();

  const [balanceRefetch] = useLazyQuery<IBalanceQueryResult>(GET_BALANCE, {
    variables: {
      publicKey: address,
      notifyOnNetworkStatusChange: true,
    },
    fetchPolicy: 'network-only',
    pollInterval: DEFAULT_QUERY_REFRESH_INTERVAL,
    onCompleted: data => {
      if (addBalance && data) {
        addBalance(address, data?.accountByKey?.balance || {});
      }
    },
  });

  const onAccountChange = async (wallet: {publicKey: string; accountId: number}) => {
    try {
      const walletId = await fetchWalletID({variables: {publicKey: wallet.publicKey}});
      await storeSession(
        wallet.publicKey,
        +walletId?.data?.idByPublicKey?.id || -1,
        false,
        0,
        true,
        wallet.accountId,
      );
      await updateWallet({
        address: wallet.publicKey,
        id: +walletId?.data?.idByPublicKey?.id || -1,
        ledger: false,
        ledgerAccount: 0,
        mnemonic: true,
        accountNumber: wallet.accountId,
      });
      await refetchBalance(wallet.publicKey);
    } catch (error) {
      await storeSession(wallet.publicKey, -1, false, 0, true, wallet.accountId);
      await updateWallet({
        address: wallet.publicKey,
        id: -1,
        ledger: false,
        ledgerAccount: 0,
        mnemonic: true,
        accountNumber: wallet.accountId,
      });
      await refetchBalance(wallet.publicKey);
    } finally {
      navigate('/overview');
    }
  };
  /**
   * If balance update is required (shouldBalanceUpdate) refetch it
   */
  const refetchBalance = async (newAddress?: string) => {
    if (shouldBalanceUpdate) {
      await balanceRefetch({publicKey: newAddress || address});
      if (setShouldBalanceUpdate) {
        setShouldBalanceUpdate(false);
      }
    }
  };

  return (
    <div className="account-selector-container">
      <div className="flex flex-col items-center gap-2">
        <QrCodeReader />
        <div className="flex flex-row items-center gap-2">
          <div>
            <Avatar
              address={address}
              size={30}
            />
          </div>
          {trimMiddle(address, 18)}
        </div>
        <div className="flex flex-row gap-2">
          {isUsingMnemonic && (
            <span
              onClick={() => setShowModal(true)}
              className="cursor-pointer purple-text-hover"
            >
              <Repeat
                cursor={'pointer'}
                width={15}
              />{' '}
              Change
            </span>
          )}
          {isUsingMnemonic && ' | '}
          <NetworkSettings
            network={network}
            logout={logout}
            lockSession={lockSession}
            currentNetwork={
              <p
                className="mb-0"
                style={{fontSize: '14px'}}
              >
                {renderNetworkLabel(network?.nodeInfo)} {statusDot}
              </p>
            }
          />
        </div>
        <div className="sidebar-footer-network">
          {renderNetworkLabel(network?.nodeInfo)} {statusDot}
        </div>
      </div>
      <ModalContainer
        show={showModal}
        className="w-100 max-w-1000"
        close={() => setShowModal(false)}
      >
        {' '}
        <div>
          <h2 className="text-center">Change account</h2>
          <hr />
          <MnemonicAccountSelection
            currentAddress={address}
            onAccountChange={onAccountChange}
            toggleLoader={toggleLoader}
          />
        </div>
      </ModalContainer>
    </div>
  );
}
