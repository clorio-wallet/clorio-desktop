import {useState} from 'react';
import {Shield, ArrowLeft, ArrowRight} from 'react-feather';
import Button from './UI/Button';
import Input from './UI/input/Input';
import {ModalContainer} from './UI/modals';

interface ISecureDataStorageComponent {
  show: boolean;
  onClose: () => void;
  onSubmit: (key: string) => void;
}

function SecureDataStorageComponent({show, onClose, onSubmit}: ISecureDataStorageComponent) {
  const [password, setPassword] = useState('');

  const onCloseHandler = () => {
    setPassword('');
    onClose();
  };

  const onSubmitHandler = () => {
    onSubmit(password);
  };

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
  const disableButton = !passwordRegex.test(password);

  return (
    <ModalContainer show={show} className="max-width-600">
      <div className="oi-page animate__animated animate__fadeIn">
        <div className="oi-header mb-2">
          <div className="mb-3 p-3 rounded-full bg-white-5 flex-center">
            <Shield size={32} className="purple-text" />
          </div>
          <h1 className="oi-title">Set up a password</h1>
          <p className="oi-description">
            Create a password to unlock your wallet on this device.
          </p>
        </div>

        <div className="oi-security-banner w-100">
          <div className="oi-security-text">
            <strong>Password Requirements</strong>
            <p>
              Must be 6-16 characters long, including at least one number 
              and one special character (!@#$%^&*).
            </p>
          </div>
        </div>

        <div className="w-100 mt-2">
          <label className="oi-section-label mb-2 px-1">Password</label>
          <Input
            type="text"
            hidden
            placeholder="Create a password..."
            value={password}
            inputHandler={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPassword(e.target.value);
            }}
          />
        </div>

        <div className="oi-footer-row w-100 mt-4">
          <div className="oi-actions oi-actions--wide mx-auto">
            <Button
              text="Cancel"
              icon={<ArrowLeft />}
              onClick={onCloseHandler}
              style="no-style"
            />
            <Button
              onClick={onSubmitHandler}
              text="Continue"
              style="primary"
              icon={<ArrowRight />}
              disabled={disableButton}
              appendIcon
            />
          </div>
        </div>
      </div>
    </ModalContainer>
  );
}

export default SecureDataStorageComponent;
