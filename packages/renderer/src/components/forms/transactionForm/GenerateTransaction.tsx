import {useEffect, useState} from 'react';
import {toast} from 'react-toastify';
import {deriveAccountFromMnemonic} from '/@/tools';
import {signTransaction} from '/@/tools/utils';
import {ModalContainer} from '../../UI/modals';
import PasswordDecrypt from '../../PasswordDecrypt';
import GenerateTransactionResult from './GenerateTransactionResult';
import {useRecoilValue} from 'recoil';
import {walletState} from '/@/store';

enum ModalStates {
  INITIAL,
  PASSPHRASE,
  RESULT,
}

export interface ISignedTransactionData {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string;
  data: {
    to: string;
    from: string;
    fee: string;
    amount: string;
    nonce: string;
    memo: string;
    validUntil: string;
  };
}

interface IGenerateTransactionProps {
  show: boolean;
  onClose?: () => void;
  transactionData: {
    nonce: string;
    receiverAddress: string;
    fee: string;
    amount: string;
  };
}

const GenerateTransaction = ({transactionData, show, onClose}: IGenerateTransactionProps) => {
  const wallet = useRecoilValue(walletState);
  const [showModal, setShowModal] = useState<ModalStates>(ModalStates.INITIAL);
  const isLedgerEnabled = wallet.ledger;
  const [signingResult, setSigningResult] = useState<ISignedTransactionData | undefined>();

  const closeModal = () => {
    setShowModal(ModalStates.INITIAL);
    if (onClose) onClose();
  };

  const generateTransaction = async (passphrase: string) => {
    try {
      const {nonce, receiverAddress, fee, amount} = transactionData;
      const derivedData = await deriveAccountFromMnemonic(passphrase.trim(), wallet.accountNumber);
      if (derivedData) {
        const signedPayment = await signTransaction(derivedData.priKey, {
          ...transactionData,
          from: derivedData?.pubKey,
          to: receiverAddress,
          nonce: nonce,
          fee,
          amount,
        });

        if (signedPayment) {
          setSigningResult(signedPayment as ISignedTransactionData);
          setShowModal(ModalStates.RESULT);
        } else {
          throw new Error('Error generating transaction');
        }
      } else {
        throw new Error('Error deriving account');
      }
    } catch (e) {
      toast.error('Error generating transaction');
      console.error(e);
    }
  };

  useEffect(() => {
    if (show && showModal === ModalStates.INITIAL) {
      setShowModal(ModalStates.PASSPHRASE);
    }
  }, [show, showModal]);

  return (
    <>
      {!isLedgerEnabled && (
        <div className="flex flex-row">
          <ModalContainer
            show={show && showModal === ModalStates.PASSPHRASE}
            close={closeModal}
            className="confirm-transaction-modal"
            closeOnBackgroundClick={false}
          >
            <div>
              <h1>Sign offline transaction</h1>
              <hr />
            </div>

            <PasswordDecrypt
              onClose={closeModal}
              onSuccess={generateTransaction}
              text={
                <p>
                  You will generate a transaction offline. This transaction will not be broadcasted.
                  <br />
                  In order to broadcast it, you will need to broadcast it manually.
                  <br />
                  Please insert your password to proceed.
                </p>
              }
            />
          </ModalContainer>
          <GenerateTransactionResult
            show={showModal === ModalStates.RESULT}
            onClose={() => setShowModal(ModalStates.INITIAL)}
            transactionResult={signingResult}
          />
        </div>
      )}
    </>
  );
};

export default GenerateTransaction;
