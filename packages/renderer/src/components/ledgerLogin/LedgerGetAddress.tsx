import {useState, useEffect} from 'react';
import {getPublicKey} from '/@/tools/ledger/ledger';
import {toast} from 'react-toastify';
import {storeAccounts, storeSession} from '/@/tools';
import {useLazyQuery} from '@apollo/client';
import LedgerConfirmAddress from './LedgerConfirmAddress';
import type {IWalletIdData} from '../../types/WalletIdData';
import LedgerLoader from '../UI/ledgerLogin/LedgerLoader';
import {ArrowLeft} from 'react-feather';
import {useNavigate} from 'react-router-dom';
import {useSetRecoilState} from 'recoil';
import {configState, walletState} from '/@/store';
import {GET_ID} from '/@/graphql/query';
import Button from '../UI/Button';

interface IProps {
  accountNumber?: number;
  toggleLoader: () => void;
}

const LedgerGetAddress = ({accountNumber, toggleLoader}: IProps) => {
  const [publicKey, setPublicKey] = useState<string>('');
  const [ledgerAccount] = useState<number>(accountNumber || 0);
  const navigate = useNavigate();
  const setConfig = useSetRecoilState(configState);
  const updateWallet = useSetRecoilState(walletState);

  const [userIdFetch, {data: walletIdData}] = useLazyQuery<IWalletIdData>(GET_ID);

  useEffect(() => {
    getPublicAddress();
  }, []);

  useEffect(() => {
    if (publicKey) {
      userIdFetch({variables: {publicKey}});
    }
  }, [publicKey]);

  const setSession = async () => {
    if (walletIdData && !!publicKey) {
      toggleLoader();
      const id = +walletIdData?.idByPublicKey?.id || -1;
      storeSession({
        address: publicKey,
        id,
        ledger: true,
        ledgerAccount,
        mnemonic: false,
        accountNumber: 0,
      });

      await updateWallet({
        address: publicKey,
        id,
        ledger: true,
        ledgerAccount,
        mnemonic: false,
        accountNumber: 0,
        isAuthenticated: true,
      });

      storeAccounts([{accountId: 0, address: publicKey}]);

      setConfig(prev => ({
        ...prev,
        isAuthenticated: true,
        isUsingMnemonic: false,
        isLedgerEnabled: true,
        isLocked: false,
      }));
      navigate('/overview');
    }
  };

  const getPublicAddress = async () => {
    try {
      const ledgerPublicKey = await getPublicKey(ledgerAccount);
      setPublicKey(ledgerPublicKey.publicKey);
    } catch (e: any) {
      console.log(e);
      toast.error(e.message || 'An error occurred while loading hardware wallet');
    }
  };

  return (
    <div className="ledger-page animate__animated animate__fadeIn">
      {/* ── Header ── */}
      <div className="oi-header">
        <h1 className="oi-title">Verify Address</h1>
        <p className="oi-description">Confirm the Public key from your Ledger device.</p>
      </div>

      {!publicKey ? (
        <div className="w-100 mt-4 flex flex-col items-center">
          <div className="ledger-animation-container">
            <LedgerLoader />
          </div>

          <div className="text-center px-4 max-width-480 mx-auto opacity-70 mb-5">
            <p className="text-center mb-2">
              Looking for the Public key. Please confirm it on your Ledger device.
            </p>
            <p className="text-center small">This could take up to 30-60 seconds.</p>
          </div>

          <div className="oi-footer-row w-100 mt-auto">
            <div className="oi-actions oi-actions--wide mx-auto">
              <Button
                className="oi-back"
                text="Back"
                icon={<ArrowLeft />}
                link="/login-selection"
                style="quiet"
                disableHoverStyle
              />
              <div className="w-100" />
            </div>
          </div>
        </div>
      ) : (
        <LedgerConfirmAddress
          publicKey={publicKey}
          setSession={setSession}
        />
      )}
    </div>
  );
};

export default LedgerGetAddress;
