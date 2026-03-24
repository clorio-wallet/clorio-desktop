import {ArrowLeft, ArrowRight} from 'react-feather';
import Button from '../UI/Button';

interface IProps {
  publicKey: string;
  setSession: () => void;
}

const LedgerConfirmAddress = ({ publicKey, setSession }: IProps) => {
  return publicKey ? (
    <div className="animate__animated animate__fadeInUp mt-4 w-100 flex flex-col items-center">
      <div className="oi-section-header w-100 max-width-480 mx-auto mb-2">
        <span className="oi-section-label opacity-60">Your Ledger Address</span>
      </div>
      
      <div className="oi-word-cell oi-word-cell--full max-width-480 mx-auto mb-4 py-3">
        <span className="oi-word-static-text selectable-text font-mono text-center w-100">{publicKey}</span>
      </div>
      
      <p className="text-center opacity-80 max-width-480 mx-auto px-4 mb-5">
        Please confirm this address on your Ledger device to continue.
      </p>
      
      <div className="oi-footer-row w-100 mt-2">
        <div className="oi-actions oi-actions--wide mx-auto">
          <Button
            className="oi-back"
            icon={<ArrowLeft />}
            text="Back"
            link="/login-selection"
            style="no-style"
          />
          <Button
            onClick={setSession}
            text="Access wallet"
            style="primary"
            icon={<ArrowRight />}
            appendIcon
          />
        </div>
      </div>
    </div>
  ) : null;
};

export default LedgerConfirmAddress;
