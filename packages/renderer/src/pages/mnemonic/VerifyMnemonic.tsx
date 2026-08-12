import { isElectron } from '/@/tools/environment';
import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'react-feather';
import Button from '../../components/UI/Button';
import ReactTooltip from 'react-tooltip';

interface IProps {
  mnemonic: string;
  closeVerification: () => void;
  goBack: () => void;
  completeRegistration: () => void;
  storePassphraseHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
  storePassphrase: boolean;
}

const VerifyMnemonic = ({
  mnemonic,
  closeVerification,
  goBack,
  completeRegistration,
  storePassphraseHandler,
  storePassphrase,
}: IProps) => {
  const [removedIndex] = useState([
    Math.floor(Math.random() * 4) + 1,
    Math.floor(Math.random() * 4) + 5,
    Math.floor(Math.random() * 4) + 9,
  ]);
  const [typedWords, setTypedWords] = useState(['', '', '']);

  const validateWord = (index: number, word: string) => {
    const nextTyped = [...typedWords];
    const internalIndex = removedIndex.indexOf(index + 1);
    if (internalIndex !== -1) {
      nextTyped[internalIndex] = word.trim().toLowerCase();
      setTypedWords(nextTyped);
    }
  };

  const removeWords = () => {
    return mnemonic.split(' ').map((el, index) => {
      return removedIndex.includes(index + 1) ? null : el;
    });
  };

  const isWordCorrect = (index: number) => {
    const word = mnemonic.split(' ')[index];
    const internalIndex = removedIndex.indexOf(index + 1);
    return typedWords[internalIndex] === word;
  };

  const disableButton = !isWordCorrect(removedIndex[0] - 1) ||
    !isWordCorrect(removedIndex[1] - 1) ||
    !isWordCorrect(removedIndex[2] - 1);

  return (
    <div className="oi-page animate__animated animate__fadeIn">
      <div className="oi-header">
        <h1 className="oi-title">Create new wallet</h1>
        <p className="oi-description">Verify your recovery phrase by filling in the missing words.</p>
      </div>

      <div className="oi-content-section">
        <div className="oi-grid oi-grid--3-col mb-5">
          {removeWords().map((el, index) => {
            const isMissing = el === null;
            return (
              <div
                key={index}
                className={`oi-word-cell ${isMissing ? 'oi-word-cell--input' : 'oi-word-cell--static'}`}
              >
                <span className="oi-word-index">{index + 1}</span>
                {isMissing ? (
                  <input
                    className="oi-word-input"
                    placeholder="Type word..."
                    onChange={e => validateWord(index, e.currentTarget.value)}
                    autoComplete="off"
                    autoFocus={index === removedIndex[0] - 1}
                  />
                ) : (
                  <span className="oi-word-static-text">{el}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mb-4">
          <label className="oi-confirm-label cursor-pointer" htmlFor="storePassphrase">
            <input
              className="oi-checkbox"
              type="checkbox"
              name="storePassphrase"
              id="storePassphrase"
              onChange={storePassphraseHandler}
              checked={storePassphrase}
              disabled={!isElectron()}
            />
            <span>Store the passphrase encrypted on this device</span>
          </label>
        </div>
      </div>

      <div className="oi-footer-row mt-4">
        <div className="oi-actions oi-actions--wide">
          <Button
            className="oi-back"
            icon={<ArrowLeft />}
            text="Back"
            onClick={() => {
              goBack();
              closeVerification();
            }}
            style="quiet"
            disableHoverStyle
          />
          <Button
            text="Complete & Create"
            style="primary"
            icon={<ArrowRight />}
            appendIcon
            onClick={completeRegistration}
            disabled={disableButton}
          />
        </div>
      </div>
      <ReactTooltip id="VerifyMnemonic" />
    </div>
  );
};

export default VerifyMnemonic;
