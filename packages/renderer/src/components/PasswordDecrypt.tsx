import {useEffect, useState} from 'react';
import useSecureStorage from '../hooks/useSecureStorage';
import {toast} from 'react-toastify';
import Input from './UI/input/Input';
import {Col, Row} from 'react-bootstrap';
import Button from './UI/Button';
import {ArrowRight} from 'react-feather';
import {ReactNode} from 'react';

interface IPasswordDecrypt {
  onSuccess: (passphrase: string) => void;
  onClose: () => void;
  text?: string | ReactNode;
}

export default function PasswordDecrypt({onSuccess, onClose, text}: IPasswordDecrypt) {
  const [password, setPassword] = useState('');
  const {decryptData} = useSecureStorage();

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
  const disableButton = !passwordRegex.test(password);

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
        onSuccess(privateKey);
      } else {
        toast.error('Wrong password');
      }
    } catch (error) {
      toast.error('Wrong password');
    }
  };

  return (
    <div>
      <p className="mt-3 text-center">{text || 'Insert your password to proceed'}</p>
      <div className="password-input">
        <Input
          type="text"
          hidden
          value={password}
          inputHandler={e => {
            setPassword(e.target.value);
          }}
        />
      </div>
      <div className="v-spacer" />
      <Row>
        <Col>
          <Button
            className="big-icon-button"
            text="Cancel"
            onClick={onClose}
          />
        </Col>
        <Col>
          <Button
            onClick={onSubmitHandler}
            text="Confirm"
            style="primary"
            icon={<ArrowRight />}
            disabled={disableButton}
            appendIcon
          />
        </Col>
      </Row>
    </div>
  );
}
