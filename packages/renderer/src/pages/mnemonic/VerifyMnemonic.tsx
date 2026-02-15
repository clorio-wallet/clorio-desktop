import {isElectron} from '/@/tools/environment';
import {useState} from 'react';
import {Row, Col} from 'react-bootstrap';
import {ArrowLeft, ArrowRight} from 'react-feather';
import Button from '../../components/UI/Button';
import ReactTooltip from 'react-tooltip';

interface IProps {
  mnemonic: string;
  closeVerification: () => void;
  completeRegistration: () => void;
  storePassphraseHandler: () => void;
  storePassphrase?: boolean;
  goBack: () => void;
}

export function VerifyMnemonic({
  mnemonic,
  closeVerification,
  completeRegistration,
  storePassphraseHandler,
  storePassphrase,
  goBack,
}: IProps) {
  const [disableButton, setDisableButton] = useState<boolean>(true);
  const [wordsFoundArray, setWordsFoundArray] = useState<string[]>([]);

  /**
   * Generate an array containing 4 to 12 words positions to be guessed
   * @returns number[]
   */
  const selectRandomIndexes = () => {
    const numberOfWords = 3;
    const randomIndexes: any[] = [];
    while (randomIndexes.length <= numberOfWords) {
      const tmpIndex = Math.floor(1 + Math.random() * 12);
      if (!randomIndexes.includes(tmpIndex)) {
        randomIndexes.push(tmpIndex);
      }
    }
    return randomIndexes.sort();
  };
  const [removedIndex] = useState<number[]>(selectRandomIndexes());

  /**
   * Generate an array containing all the passphrase words except the randomly removed words
   * @returns string|null[]
   */
  const removeWords = () => {
    const newPassphrase = [];
    const passphraseSplit = mnemonic.split(' ');
    for (const index in passphraseSplit) {
      if (removedIndex.includes(parseInt(index) + 1)) {
        newPassphrase.push(null);
      } else {
        newPassphrase.push(passphraseSplit[index]);
      }
    }
    return newPassphrase;
  };

  /**
   * Check if the word is included inside the original passphrase and the position is correct.
   * If all the words have been found, enable the proceed button.
   * @param index index of the word
   * @param word input word
   */
  const validateWord = (index: number, word: string) => {
    const wordsFound = wordsFoundArray;
    const splitWords = mnemonic.split(' ');
    if (splitWords[index] === word) {
      wordsFound.push(word);
    } else if (wordsFound.includes(splitWords[index])) {
      const wordIndex = wordsFound.indexOf(splitWords[index]);
      wordsFound.splice(wordIndex, 1);
    }
    setWordsFoundArray(wordsFound);
    if (!disableButton) {
      if (wordsFound.length !== removedIndex.length) {
        setDisableButton(true);
      }
    } else if (wordsFound.length === removedIndex.length) {
      setDisableButton(false);
    }
  };

  return (
    <div className="animate__animated animate__fadeIn glass-card registration-card justify-center">
      <div className="">
        <div className="w-100">
          <div className="flex flex-col flex-vertical-center">
            <h1>Create new wallet</h1>
            <p className="text-center mt-1">Verify your passphrase</p>
            <div className="divider" />
          </div>
        </div>
        <div className="v-spacer" />
        <div className="passphrase-box">
          {removeWords().map((el, index) => {
            return el !== null ? (
              <div
                key={index}
                className="inline-block-element word-box align-left"
              >
                <span className="word-index">{index + 1}.</span> <span>{el}</span>
              </div>
            ) : (
              <div
                key={index}
                className="inline-block-element word-box align-left"
              >
                <span className="word-index">{index + 1}.</span>{' '}
                <input
                  className="validation-input"
                  onChange={e => validateWord(index, e.currentTarget.value)}
                  autoComplete="off"
                />
              </div>
            );
          })}
        </div>
        <div className="v-spacer" />
        <div>
          <span
            className="checkbox-container"
            data-tip={
              !isElectron()
                ? 'For your security, you can store the passphrase only on Clorio Desktop'
                : undefined
            }
          >
            <input
              className="checkbox"
              type="checkbox"
              name="storePassphrase"
              id="storePassphrase"
              value={isElectron() ? 'show' : ''}
              onChange={storePassphraseHandler}
              checked={storePassphrase}
              disabled={!isElectron()}
            />
            <label
              className="ml-2 checkbox-label"
              htmlFor="storePassphrase"
            >
              Store the passphrase
            </label>
          </span>
        </div>
        <Row>
          <Col xs={6}>
            <Button
              className="big-icon-button"
              icon={<ArrowLeft />}
              text="Go back"
              onClick={() => {
                goBack();
                closeVerification();
              }}
            />
          </Col>
          <Col xs={6}>
            <Button
              text="Complete"
              style="primary"
              icon={<ArrowRight />}
              appendIcon
              onClick={completeRegistration}
              disabled={disableButton}
            />
          </Col>
        </Row>
      </div>
      <ReactTooltip id="VerifyMnemonic" />
    </div>
  );
}
