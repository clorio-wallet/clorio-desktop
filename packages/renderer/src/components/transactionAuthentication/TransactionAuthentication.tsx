import {AlertTriangle, ArrowRight, Repeat, Shield} from 'react-feather';
import Button from '../UI/Button';
import Input from '../UI/input/Input';
import Spinner from '../UI/Spinner';
import PasswordDecrypt from '../PasswordDecrypt';
import useSecureStorage from '/@/hooks/useSecureStorage';
import './TransactionAuthentication.scss';

interface IProps {
  isLedgerEnabled?: boolean;
  ledgerError?: boolean;
  storedPassphrase?: boolean;
  retryLedgerTransaction: () => void;
  setPrivateKey: (privateKey: string) => void;
  stepBackwards?: () => void;
  confirmPrivateKey?: (passphrase?: string) => void;
  stepBackward: () => void;
}

const TransactionAuthentication = ({
  isLedgerEnabled,
  confirmPrivateKey,
  setPrivateKey,
  stepBackwards,
  ledgerError,
  stepBackward,
  retryLedgerTransaction,
  storedPassphrase,
}: IProps) => {
  const {hasEncryptedData} = useSecureStorage();
  const shouldUsePasswordDecrypt = !!storedPassphrase && hasEncryptedData;

  if (shouldUsePasswordDecrypt) {
    return (
      <div className="tx-auth tx-auth--password">
        <div className="tx-auth__header">
          <span className="tx-auth__eyebrow">Unlock</span>
          <h3 className="tx-auth__title">Enter your password</h3>
          <p className="tx-auth__subtitle">
            Unlock this device to sign the transaction.
          </p>
        </div>
        <div className="tx-auth__panel tx-auth__panel--password">
          <PasswordDecrypt
            onClose={stepBackward}
            onSuccess={(passphrase: string) => {
              confirmPrivateKey(passphrase);
            }}
          />
        </div>
      </div>
    );
  }

  if (isLedgerEnabled && ledgerError) {
    return (
      <div className="tx-auth">
        <div className="tx-auth__header">
          <span className="tx-auth__eyebrow">Ledger</span>
          <h3 className="tx-auth__title">Signature failed</h3>
          <p className="tx-auth__subtitle">
            Check your Ledger and try again.
          </p>
        </div>
        <div className="tx-auth__panel tx-auth__panel--error">
          <div className="tx-auth__status-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="tx-auth__status-copy">
            <strong>Open the Mina app</strong>
            <span>Reconnect the device if needed, then retry.</span>
          </div>
        </div>
        <div className="tx-auth__actions">
          <Button
            className="big-icon-button"
            text="Go back"
            onClick={stepBackward}
          />
          <Button
            text="Retry"
            style="primary"
            icon={<Repeat />}
            appendIcon
            onClick={retryLedgerTransaction}
          />
        </div>
      </div>
    );
  }

  return isLedgerEnabled ? (
    <div className="tx-auth">
      <div className="tx-auth__header">
        <span className="tx-auth__eyebrow">Ledger</span>
        <h3 className="tx-auth__title">Confirm on your Ledger</h3>
        <p className="tx-auth__subtitle">
          Review the transaction on your device and approve it in the Mina app.
        </p>
      </div>
      <div className="tx-auth__panel tx-auth__panel--ledger">
        <div className="tx-auth__spinner-wrap">
          <Spinner
            show={true}
            fullscreen={false}
          />
        </div>
        <div className="tx-auth__status-copy">
          <strong>Waiting for signature</strong>
          <span>This can take up to 3 minutes.</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="tx-auth">
      <div className="tx-auth__header">
        <span className="tx-auth__eyebrow">Sign</span>
        <h3 className="tx-auth__title">Enter your recovery phrase or private key</h3>
        <p className="tx-auth__subtitle">
          Use it to sign the transaction on this device.
        </p>
      </div>

      <div className="tx-auth__panel tx-auth__panel--manual">
        <div className="tx-auth__status-icon">
          <Shield size={18} />
        </div>
        <div className="tx-auth__status-copy">
          <strong>Local signing</strong>
          <span>Your secret is used only to create the signature.</span>
        </div>
      </div>

      <div className="tx-auth__field">
        <label className="tx-auth__field-label" htmlFor="tx-auth-secret">
          Recovery phrase or private key
        </label>
        <Input
          id="tx-auth-secret"
          inputHandler={e => setPrivateKey(e.currentTarget.value)}
          placeholder="Enter your recovery phrase or private key"
          hidden={true}
          type="text"
        />
      </div>

      <div className="tx-auth__actions">
        <Button
          className="big-icon-button"
          text="Cancel"
          onClick={stepBackwards}
          style='quiet'
        />
        <Button
          text="Sign transaction"
          style="primary"
          icon={<ArrowRight />}
          appendIcon
          onClick={confirmPrivateKey}
        />
      </div>
    </div>
  );
};

export default TransactionAuthentication;
