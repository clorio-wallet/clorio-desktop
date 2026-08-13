import {useRecoilState, useRecoilValue} from 'recoil';
import {walletState, zkappState} from '/@/store';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../../Button';
import PasswordDecrypt from '/@/components/PasswordDecrypt';
import {useState} from 'react';
import {client} from '/@/tools';
import {mnemonicToPrivateKey} from '../../../../../../preload/src/bip';
import {toast} from 'react-toastify';
import MessageData from './MessageData';
import {Edit3} from 'react-feather';
import {ZkappModal, ZkappModalActions} from './ZkappModal';

export default function SignMessage() {
  const wallet = useRecoilValue(walletState);
  const [showPassword, setShowPassword] = useState(false);
  const [
    {messageToSign, showMessageSign, isJsonMessageToSign, isNullifier, isFields},
    setZkappState,
  ] = useRecoilState(zkappState);

  const responseChannel = isFields
    ? 'clorio-signed-fields'
    : isNullifier
    ? 'clorio-created-nullifier'
    : isJsonMessageToSign
    ? 'clorio-signed-json-message'
    : 'clorio-signed-message';

  const onClose = () => {
    setZkappState(state => ({
      ...state,
      showMessageSign: false,
      isJsonMessageToSign: false,
      isNullifier: false,
      isFields: false,
      messageToSign: '',
    }));
  };

  const onConfirm = async (mnemonic: string) => {
    if (!mnemonic) return;

    let privateKey = mnemonic;
    if (mnemonic.trim().split(' ').length > 2) {
      privateKey = (await mnemonicToPrivateKey(mnemonic, wallet.accountNumber)) || mnemonic;
    }

    let signedMessage;
    if (isFields || isNullifier) {
      const nextFields = messageToSign.map(BigInt);
      if (isFields) {
        signedMessage = await (await client()).signFields(nextFields, privateKey);
      } else {
        signedMessage = await (await client()).createNullifier(nextFields, privateKey);
      }
    } else {
      signedMessage = (await client()).signMessage(messageToSign, privateKey);
    }

    if (signedMessage) {
      toast.success('Message signed successfully');
      sendResponse(responseChannel, signedMessage);
      setZkappState(prev => ({
        ...prev,
        messageToSign: '',
        showMessageSign: false,
        isJsonMessageToSign: false,
        isNullifier: false,
        isFields: false,
      }));
      setShowPassword(false);
    } else {
      toast.error('Error signing message');
    }
  };

  return (
    <ZkappModal
      show={showMessageSign}
      close={onClose}
      title="Sign message"
      subtitle="Review the requested content before signing with your active account."
      icon={<Edit3 size={20} />}
    >
      {showPassword ? (
        <PasswordDecrypt onClose={() => setShowPassword(false)} onSuccess={onConfirm} />
      ) : (
        <>
          <MessageData messageToSign={messageToSign} />
          <ZkappModalActions>
            <Button text="Cancel" variant="outlined" onClick={onClose} />
            <Button text="Continue to sign" style="primary" onClick={() => setShowPassword(true)} />
          </ZkappModalActions>
        </>
      )}
    </ZkappModal>
  );
}
