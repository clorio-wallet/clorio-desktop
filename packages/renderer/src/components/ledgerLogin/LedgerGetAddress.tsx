import {useState, useEffect} from 'react';
import Button from '../UI/Button';
import {useQuery} from '@apollo/client';
import {storeAccounts, storeSession} from '../../tools';
import {GET_ID} from '../../graphql/query';
import {toast} from 'react-toastify';
import LedgerConfirmAddress from './LedgerConfirmAddress';
import type {IWalletIdData} from '../../types/WalletIdData';
import LedgerLoader from '../UI/ledgerLogin/LedgerLoader';
import {ArrowLeft} from 'react-feather';
import {useNavigate} from 'react-router-dom';
import {useSetRecoilState} from 'recoil';
import {configState, walletState} from '/@/store';
import {getPublicKey} from '/@/tools/ledger/ledger';

interface IProps {
  accountNumber?: number;
  toggleLoader: () => void;
}

const LedgerGetAddress = ({accountNumber, toggleLoader}: IProps) => {
  const [publicKey, setPublicKey] = useState<string>('');
  const [ledgerAccount] = useState<number>(accountNumber || 0);
  const navigate = useNavigate();
  const {data: walletIdData} = useQuery<IWalletIdData>(GET_ID, {
    variables: {publicKey: publicKey},
    skip: !publicKey,
  });
  const setConfig = useSetRecoilState(configState);
  const updateWallet = useSetRecoilState(walletState);

  /**
   * On component load get the wallet data from the Ledger
   */
  useEffect(() => {
    const deviceListener = getWallet();
    // TODO : To be checked with ledger tests
    // @ts-ignore
    return deviceListener.unsubscribe;
  }, []);

  /**
   * Set public key that arrived from Ledger inside the storage
   */
  const setSession = async () => {
    if (walletIdData && !!publicKey) {
      toggleLoader();
      const id = +walletIdData?.idByPublicKey?.id || -1;
      const success = await storeSession({
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
      });

      storeAccounts([{accountId: 0, address: publicKey}]);
      if (success) {
        setConfig(prev => ({
          ...prev,
          isAuthenticated: true,
          isUsingMnemonic: false,
          isLedgerEnabled: true,
          isLocked: false,
        }));
        navigate('/overview');
      }
    }
  };

  /**
   * Listen for ledger action.
   * On error go back to the splashscreen
   */
  const getWallet = async () => {
    try {
      const ledgerPublicKey = await getPublicKey(ledgerAccount);
      setPublicKey(ledgerPublicKey.publicKey);
    } catch (e) {
      console.log(e);
      toast.error(e.message || 'An error occurred while loading hardware wallet');
    }
  };

  return (
    <div className="full-screen-container-center animate__animated animate__fadeIn">
      <div className=" glass-card flex flex-vertical-center p-5">
        <div>
          <div className="w-100">
            <div className="flex flex-col flex-vertical-center">
              <h1>Login</h1>
              <p className="text-center mt-1">Let&apos;s verify the your address</p>
              <div className="divider w-100" />
            </div>
          </div>
          {!publicKey ? (
            <div>
              <LedgerLoader width="500px" />
              <p className="full-width-align-center my-4">
                Looking for the Public key. Please confirm it on your Ledger device
              </p>
              <h6 className="w-100 text-center mb-4">
                This could take up to one minute and a half
              </h6>
              <Button
                className="big-icon-button w-50 mx-auto"
                icon={<ArrowLeft />}
                text="Go back"
                link="/login-selection"
              />
            </div>
          ) : (
            <LedgerConfirmAddress
              publicKey={publicKey}
              setSession={setSession}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerGetAddress;
