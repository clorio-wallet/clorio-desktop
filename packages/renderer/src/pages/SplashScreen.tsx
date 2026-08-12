import Hoc from '../components/UI/Hoc';
import Homepage from '../components/UI/Homepage';
import {deriveAccount, setPassphrase, storeSession} from '/@/tools';
import useSecureStorage from '../hooks/useSecureStorage';
import RestoreSession from '../components/RestoreSession';
import {toast} from 'react-toastify';
import {useLazyQuery} from '@apollo/client';
import {IWalletIdData} from '../types';
import {GET_ID} from '../graphql/query';
import {useNavigate} from 'react-router-dom';
import {useSetRecoilState} from 'recoil';
import {walletState} from '../store';

interface IProps {
  toggleLoader: (state: boolean) => void;
}

const SplashScreen = ({toggleLoader}: IProps) => {
  const navigate = useNavigate();
  const [fetchWalletId] = useLazyQuery<IWalletIdData>(GET_ID, {
    variables: {
      publicKey: null,
    },
  });

  const updateWallet = useSetRecoilState(walletState);

  const {hasEncryptedData} = useSecureStorage();
  const onLogin = async (privateKey: string) => {
    toggleLoader(true);
    const derivedAccount = await deriveAccount(privateKey);
    if (derivedAccount.publicKey) {
      const {data, called} = await fetchWalletId({
        variables: {publicKey: derivedAccount.publicKey as string},
      });
      if (called) {
        const id = data?.idByPublicKey.id || -1;
        const isUsingMnemonic =
          privateKey.trim().split(' ').length === 12 || privateKey.trim().split(' ').length === 24;
        setPassphrase(isUsingMnemonic);
        await storeSession({
          address: derivedAccount.publicKey,
          id: +id,
          ledger: false,
          ledgerAccount: 0,
          mnemonic: isUsingMnemonic,
          accountNumber: 0,
        });
        updateWallet({
          address: derivedAccount.publicKey,
          id: +id,
          ledger: false,
          ledgerAccount: 0,
          mnemonic: isUsingMnemonic,
          accountNumber: 0,
          isAuthenticated: true,
        });
        navigate('/overview');
        toggleLoader(false);
      }
    }
    toggleLoader(true);
    toast.success('Welcome back');
  };

  return (
    <Hoc>
      <div className="animate__animated animate__fadeIn">
        {hasEncryptedData ? <RestoreSession onLogin={onLogin} /> : <Homepage />}
      </div>
    </Hoc>
  );
};

export default SplashScreen;
