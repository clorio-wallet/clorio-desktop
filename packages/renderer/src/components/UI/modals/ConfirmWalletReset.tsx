import {AlertTriangle} from 'react-feather';
import Button from '../Button';
import './ConfirmWalletReset.scss';

interface IProps {
  confirmReset: () => void;
  closeModal: () => void;
}

export const ConfirmWalletReset = ({confirmReset, closeModal}: IProps) => (
  <div className="confirm-wallet-reset">
    <div className="confirm-wallet-reset__header">
      <div className="confirm-wallet-reset__icon">
        <AlertTriangle size={32} />
      </div>
      <h1 className="confirm-wallet-reset__title">Delete Wallet Data</h1>
      <p className="confirm-wallet-reset__subtitle">
        This will permanently remove all your wallet data from this device.
      </p>
    </div>

    <div className="confirm-wallet-reset__warning">
      <div className="confirm-wallet-reset__warning-header">
        <span>What happens next:</span>
      </div>
      <ul className="confirm-wallet-reset__list">
        <li>All addresses and balances will be removed</li>
        <li>Private keys stored locally will be deleted</li>
        <li>You must import your wallet again to access your funds</li>
      </ul>
    </div>

    <div className="confirm-wallet-reset__important">
      <strong>Important:</strong> <br />
      If you have not backed up your recovery phrase, you will lose access to your funds permanently.
    </div>

    <div className="confirm-wallet-reset__actions">
      <Button
        className="confirm-wallet-reset__cancel"
        text="Keep my wallet"
        onClick={closeModal}
      />
      <Button
        className="confirm-wallet-reset__confirm"
        text="Delete wallet data"
        onClick={confirmReset}
      />
    </div>
  </div>
);
