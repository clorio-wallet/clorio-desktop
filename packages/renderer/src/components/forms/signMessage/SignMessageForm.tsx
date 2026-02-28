import {useContext, useEffect, useState} from 'react';
import {client, deriveAccount, getPassphraseFlag} from '../../../tools';
import Button from '../../UI/Button';
import HelpHint from '../../UI/HelpHint';
import Input from '../../UI/input/Input';
import SignMessageResult from './SignMessageResult';
import type {ILedgerContext} from '../../../contexts/ledger/LedgerTypes';
import {LedgerContext} from '../../../contexts/ledger/LedgerContext';
import type {IKeypair, IMessageToSign} from '../../../types';
import {toast} from 'react-toastify';
import SignMessageLedgerScreen from '../../UI/signMessage/SignMessageLedgerScreen';
import {Edit3} from 'react-feather';
import useSecureStorage from '/@/hooks/useSecureStorage';
import {useWallet} from '/@/contexts/WalletContext';

const SignMessageForm = () => {
  const [message, setMessage] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [password, setPassword] = useState('');
  const [storedPassphrase, setStoredPassphrase] = useState('');
  const [proceedWithLedger, setProceedWithLedger] = useState(false);
  const {decryptData} = useSecureStorage();
  const {wallet} = useWallet();

  const [result, setResult] = useState({
    data: '',
    signature: {
      scalar: '',
      field: '',
    },
    publicKey: '',
  });

  useEffect(() => {
    setStoredPassphrase(getPassphraseFlag());
  }, []);

  const {isLedgerEnabled} = useContext<Partial<ILedgerContext>>(LedgerContext);

  /**
   * If fields are not empty, sign the message and set the result inside the component state
   */
  const submitHandler = async (messageToSign: IMessageToSign) => {
    try {
      const derivedKeypair = await deriveAccount(
        messageToSign.privateKey,
        wallet?.accountNumber || 0,
      );
      const keypair = {
        publicKey: derivedKeypair.publicKey,
        privateKey: derivedKeypair.privateKey,
      } as IKeypair;
      const result = (await client()).signMessage(messageToSign.message, keypair.privateKey);
      setResult(result);
    } catch (e) {
      toast.error('Please check the passphrase/private key');
    }
  };

  /**
   * Clear form data from state
   */
  const resetForm = () => {
    setResult({
      data: '',
      signature: {
        scalar: '',
        field: '',
      },
      publicKey: '',
    });
  };

  /**
   * Clean component state on component dismount
   */
  useEffect(() => {
    return () => {
      setMessage('');
      setPrivateKey('');
    };
  }, []);

  /**
   * Check if message and Passphrase/Private key are not empty
   * @returns boolean
   */
  const signButtonStateHandler = () => {
    return !message || (!privateKey && !password);
  };

  /**
   * Create the object to be signed and sign it
   */
  const createObjectAndSign = () => {
    let storedPrivateKey;
    if (password) {
      storedPrivateKey = decryptData(password);
    }
    const messageToSign = {
      message,
      privateKey: storedPrivateKey || privateKey,
    };
    submitHandler(messageToSign);
  };

  const onProceedLedger = () => {
    setProceedWithLedger(true);
  };

  if (isLedgerEnabled && !proceedWithLedger) {
    return <SignMessageLedgerScreen onProceed={onProceedLedger} />;
  }

  return (
    <div className="mx-auto mb-2">
      <div className="glass-card p-4">
        <div className="animate__animated animate__fadeIn align-left w-75 mx-auto">
          <h2>
            Sign message <HelpHint hint={'Cryptographically sign a message with your keypair.'} />
          </h2>
          <div className="divider w-100" />
          <h5>
            <strong>Message</strong>
          </h5>
          <div
            className="wrap-input1 validate-input"
            data-validate="Name is required"
          >
            <span className="icon" />
            <textarea
              name="message"
              id="message"
              onChange={(e: any) => setMessage(e.currentTarget.value)}
              value={message}
              placeholder="Message "
            />
          </div>
          {proceedWithLedger ? (
            <>
              <h5>
                <strong>Passphrase or Private key</strong>
              </h5>
              <div
                className="wrap-input1 validate-input"
                data-validate="Name is required"
              >
                <span className="icon" />
                <Input
                  name="privateKey"
                  value={privateKey}
                  placeholder="Passphrase or Private key"
                  inputHandler={e => setPrivateKey(e.currentTarget.value)}
                  hidden={true}
                  type="text"
                />
              </div>
            </>
          ) : storedPassphrase ? (
            <>
              <h5>
                <strong>Password</strong>
              </h5>
              <div
                className="wrap-input1 validate-input"
                data-validate="Name is required"
              >
                <Input
                  type="text"
                  hidden
                  value={password}
                  inputHandler={e => {
                    setPassword(e.target.value);
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <h5>
                <strong>Passphrase or Private key</strong>
              </h5>
              <div
                className="wrap-input1 validate-input"
                data-validate="Name is required"
              >
                <span className="icon" />
                <Input
                  name="privateKey"
                  value={privateKey}
                  placeholder="Passphrase or Private key"
                  inputHandler={e => setPrivateKey(e.currentTarget.value)}
                  hidden={true}
                  type="text"
                />
              </div>
            </>
          )}
          <div className="fit-content mx-auto">
            <Button
              text="Sign"
              style="primary"
              className="fit-content px-5 mt-4"
              icon={<Edit3 />}
              appendIcon
              onClick={createObjectAndSign}
              disabled={signButtonStateHandler()}
            />
          </div>
          <div>
            {result.data ? (
              <>
                <div className="divider w-100 mt-4" />
                <SignMessageResult
                  {...result}
                  reset={resetForm}
                />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignMessageForm;
