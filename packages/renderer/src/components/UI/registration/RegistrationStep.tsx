import {useState} from 'react';
import type {IKeypair} from '../../../types/Keypair';
import {PdfEncryption} from './PdfEncryption';
import Button from '../Button';
import {ArrowLeft, ArrowRight, FileText, Copy, Eye, EyeOff} from 'react-feather';
import {copyToClipboard} from '/@/tools/utils';
import {toast} from 'react-toastify';

interface IProps {
  keys: IKeypair;
  setValidation: (showValidation: boolean) => void;
  goToNext: () => void;
  goBack: () => void;
}

const RegisterStep = ({keys, setValidation, goToNext, goBack}: IProps) => {
  const [showEncryptionModal, setShowEncryptionModal] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState(false);

  const copyMnemonic = () => {
    if (keys.mnemonic) {
      copyToClipboard(keys.mnemonic);
      toast.success('Recovery phrase copied to clipboard', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    }
  };

  const toggleDetails = () => setShowDetails(!showDetails);

  return (
    <div className="oi-page animate__animated animate__fadeIn">
      <div className="oi-header">
        <h1 className="oi-title">Create new wallet</h1>
        <p className="oi-description">Carefully take note of your 12-word recovery phrase.</p>
      </div>

      <div className="oi-content-section">
        <div className="oi-section-header mb-4">
          <div className="oi-flex-responsive w-full gap-3">
            <div className="flex items-center gap-3">
              <span className="oi-section-label">Recovery Phrase</span>
              <div 
                className="oi-copy-badge cursor-pointer flex items-center gap-1.5" 
                onClick={copyMnemonic}
                title="Copy all words"
              >
                <Copy size={13} />
                <span>Copy All</span>
              </div>
            </div>
            
            <Button
              className="oi-toggle-details-btn p-0"
              onClick={toggleDetails}
              text={`${!showDetails ? 'Show' : 'Hide'} Public & Private Keys`}
              icon={showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
              style="no-style"
            />
          </div>
        </div>

        <div className="oi-grid oi-grid--3-col mb-4">
          {keys.mnemonic?.split(' ').map((word, index) => (
            <div key={index} className="oi-word-cell oi-word-cell--static">
              <span className="oi-word-index">{index + 1}</span>
              <span className="oi-word-static-text">{word}</span>
            </div>
          ))}
        </div>

        {showDetails && (
          <div className="oi-card mt-4 p-4 animate__animated animate__fadeIn">
            <div className="mb-4">
              <label className="oi-section-label mb-1">Public Key (Address)</label>
              <div className="oi-word-cell oi-word-cell--full">
                <span className="oi-word-static-text selectable-text font-mono text-xs">{keys.publicKey}</span>
              </div>
            </div>
            <div>
              <label className="oi-section-label mb-1">Private Key</label>
              <div className="oi-word-cell oi-word-cell--full">
                <span className="oi-word-static-text selectable-text font-mono text-xs">{keys.privateKey}</span>
              </div>
            </div>
          </div>
        )}

        <div className="oi-security-banner mt-5">
          <FileText className="oi-security-icon" strokeWidth={1.5} />
          <div className="oi-security-text">
            <strong>Security First</strong>
            <p>
              This is the only time you will see your keys. Write them down offline.
              If you lose them, you lose access to your funds forever.
            </p>
            <Button
              className="purple-text p-0 font-weight-600 mt-2 hover-underline"
              onClick={() => setShowEncryptionModal(true)}
              text={'Download Paper Wallet (PDF)'}
              style="no-style"
            />
          </div>
        </div>
      </div>

      <div className="oi-footer-row w-full mt-4">
        <div className="oi-actions oi-actions--wide mx-auto">
          <Button
            className="oi-back"
            icon={<ArrowLeft />}
            text="Back"
            onClick={goBack}
            style="quiet"
            disableHoverStyle
          />
          <Button
            onClick={() => {
              goToNext();
              setValidation(true);
            }}
            text="Continue"
            style="primary"
            icon={<ArrowRight />}
            appendIcon
          />
        </div>
      </div>

      {showEncryptionModal && (
        <PdfEncryption
          keypair={keys}
          closeModal={() => setShowEncryptionModal(false)}
        />
      )}
    </div>
  );
};

export default RegisterStep;
