import Logo from './UI/logo/Logo';
import Footer from './UI/Footer';
import {useEffect, useState} from 'react';
import {ArrowRight} from 'react-feather';
import Button from './UI/Button';
import TextField from './UI/input/TextField';
import useSecureStorage from '../hooks/useSecureStorage';
import {toast} from 'react-toastify';
import {Col} from 'react-bootstrap';
import {clearSession} from '../tools';
import {useNavigate} from 'react-router-dom';
import {useSetRecoilState} from 'recoil';
import {configState, walletState} from '../store';
import {initialWalletState} from '../store/wallet';

export default function RestoreSession({onLogin}: {onLogin: (privateKey: string) => void}) {
  const [password, setPassword] = useState('');
  const {decryptData, clearData} = useSecureStorage();
  const navigate = useNavigate();
  // const {updateWallet} = useWallet();
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
        toast.error('Wrong password');
      }
    } catch (error) {
      toast.error('Wrong password');
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
    <div className="full-screen-container-center">
      <div className="homepage-card glass-card flex md-flex-col">
        <div className="">
          <div className="half-card hero-banner mx-auto">
            <div className="flex flex-col">
              <Logo big />
              <p className="text-center mt-3">Access the power of the Mina Protocol Blockchain.</p>
            </div>
          </div>
          <div className="v-spacer" />
          <div className="half-card flex flex-col w-100 h-auto">
            <p className="text-center mt-3">Insert your password to restore the session</p>
            <TextField
              type="text"
              hidden
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
            />
            <div className="v-spacer" />
            <div className="flex flex-row sm-flex-col sm-flex-wrap-reverse gap-4">
              <Col
                xs={12}
                sm={6}
              >
                <Button
                  className="big-icon-button"
                  text="Logout"
                  onClick={onLogout}
                />
              </Col>
              <Col
                xs={12}
                sm={6}
              >
                <Button
                  onClick={onSubmitHandler}
                  text="Confirm"
                  style="primary"
                  icon={<ArrowRight />}
                  disabled={disableButton}
                  appendIcon
                />
              </Col>
            </div>
          </div>
          <div className="mt-4">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
