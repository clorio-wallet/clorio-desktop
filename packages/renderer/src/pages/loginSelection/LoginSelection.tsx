import {Link} from 'react-router-dom';
import {ArrowLeft} from 'react-feather';
import UsbDrive from './assets/usb-drive.svg';
import FileLock from './assets/file-lock.svg';
import Button from '../../components/UI/Button';

function LoginSelection() {
  return (
    <div className="full-screen-container-center animate__animated animate__fadeIn">
      <div className="homepage-card glass-card flex flex-col flex-vertical-center">
        <div className="w-100">
          <div className="flex flex-col flex-vertical-center">
          <h1>Import your wallet</h1>
          <p className="text-center mt-1">Choose how you want to access your wallet</p>
            <div className="divider" />
          </div>
        </div>
        <div className="w-75 flex flex-row min-height-200 sm-flex-col">
          <div className="half-card py-3">
            <Link to="/ledger">
              <div className="big-icon-button">
                <img
                  src={UsbDrive}
                  alt="Ledger login"
                  className="big-icon"
                />
                <p className="mt-2">Hardware wallet</p>
              </div>
            </Link>
          </div>
          <div className="half-card py-3">
            <Link to="/login">
              <div className="big-icon-button">
                <img
                  src={FileLock}
                  alt="Private key"
                  className="big-icon"
                />
                <p className="mt-2">
                  Private key <br />
                  Passphrase
                </p>
              </div>
            </Link>
          </div>
        </div>
        <div className="w-50 mt-5">
          <Button
            className="big-icon-button"
            text="Back"
            link="/"
            icon={<ArrowLeft />}
          />
        </div>
      </div>
    </div>
  );
}

export default LoginSelection;
