import {useState} from 'react';
import {toast} from 'react-toastify';
import {deriveAccountFromMnemonic} from '/@/tools';
import {signTransaction} from '/@/tools/utils';
import Button from '../../UI/Button';
import {ModalContainer} from '../../UI/modals';
import PasswordDecrypt from '../../PasswordDecrypt';
import GenerateTransactionResult from './GenerateTransactionResult';

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
  wallet: {
    ledger: boolean;
    accountNumber: number;
  };
  transactionData: {
    nonce: string;
    receiverAddress: string;
    fee: string;
    amount: string;
  };
}

const GenerateTransaction = ({wallet, transactionData}: IGenerateTransactionProps) => {
  const [showModal, setShowModal] = useState<ModalStates>(ModalStates.INITIAL);
  const isLedgerEnabled = wallet.ledger;
  const [signingResult, setSigningResult] = useState<ISignedTransactionData | undefined>();

  const closeModal = () => {
    setShowModal(ModalStates.INITIAL);
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
        }
      }
    } catch (e) {
      toast.error('Error generating transaction');
      console.error(e);
    }
  };
  return (
    <>
      {!isLedgerEnabled && (
        <div>
          <Button
            text="Generate transaction"
            style="primary"
            onClick={() => setShowModal(ModalStates.PASSPHRASE)}
          />
          <ModalContainer
            show={showModal === ModalStates.PASSPHRASE}
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
