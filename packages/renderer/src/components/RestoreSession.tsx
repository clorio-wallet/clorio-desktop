import Logo from './UI/logo/Logo';
import Footer from './UI/Footer';
import {useEffect, useState} from 'react';
import {ArrowRight} from 'react-feather';
import Button from './UI/Button';
import TextField from './UI/input/TextField';
import {ModalContainer, ConfirmWalletReset} from './UI/modals';
import useSecureStorage from '../hooks/useSecureStorage';
import {toast} from 'react-toastify';
import {clearSession} from '../tools';
import {useNavigate} from 'react-router-dom';
import {useSetRecoilState} from 'recoil';
import {configState, walletState} from '../store';
import {initialWalletState} from '../store/wallet';

export default function RestoreSession({onLogin}: {onLogin: (privateKey: string) => void}) {
  const [password, setPassword] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const {decryptData, clearData} = useSecureStorage();
  const navigate = useNavigate();
  const updateWallet = useSetRecoilState(walletState);
  const setConfig = useSetRecoilState(configState);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        onSubmitHandler();
      }
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [password]);

  const onSubmitHandler = () => {
    try {
      const privateKey = decryptData(password);
      if (privateKey) {
        onLogin(privateKey);
        setConfig(prev => ({
          ...prev,
          isAuthenticated: true,
          isLocked: false,
        }));
      } else {
        toast.error('Incorrect password. Please try again.');
      }
    } catch {
      toast.error('Incorrect password. Please try again.');
    }
  };

  const onLogout = async () => {
    await clearSession();
    updateWallet(initialWalletState);
    clearData();
    navigate('/');
    setConfig(prev => ({
      ...prev,
      isAuthenticated: false,
      isLocked: false,
      isUsingMnemonic: false,
      isLedgerEnabled: false,
      isUsingPassword: false,
    }));
  };

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
  const disableButton = !passwordRegex.test(password);

  return (
    <div className="restore-session">
      <div className="restore-session-card">
        <div className="restore-session-layout">
          <section className="restore-session-hero">
            <div className="restore-session-hero__logo">
              <Logo big />
            </div>
            <p className="restore-session-hero__tagline">
              Access the power of the Mina Protocol Blockchain.
            </p>
          </section>

          <section className="restore-session-form">
            <h2 className="restore-session-form__title">
              Enter your password to unlock your wallet
            </h2>

            <div className="restore-session-form__input">
              <TextField
                type="text"
                hidden
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
              />
            </div>

            <div className="restore-session-form__actions">
              <Button
                className="secondary"
                text="Use different wallet"
                onClick={() => setShowResetModal(true)}
              />
              <Button
                onClick={onSubmitHandler}
                text="Unlock"
                style="primary"
                icon={<ArrowRight />}
                appendIcon
                disabled={disableButton}
              />
            </div>
          </section>
        </div>

        <footer className="restore-session-footer">
          <Footer />
        </footer>
      </div>

      <ModalContainer
        show={showResetModal}
        close={() => setShowResetModal(false)}
      >
        <ConfirmWalletReset
          confirmReset={onLogout}
          closeModal={() => setShowResetModal(false)}
        />
      </ModalContainer>
    </div>
  );
}
