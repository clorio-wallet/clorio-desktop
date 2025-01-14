import {ModalContainer} from '../../UI/modals';
import {ISignedTransactionData} from './GenerateTransaction';

interface IGenerateTransactionResult {
  transactionResult?: ISignedTransactionData;
  onClose: () => void;
  show: boolean;
}

export default function GenerateTransactionResult({
  transactionResult,
  onClose,
  show,
}: IGenerateTransactionResult) {
  
  return (
    <div>
      <ModalContainer
        show={show}
        close={onClose}
      >
        <div>
          <h2 className="modal-title">Transaction Result</h2>
          <hr />
          <div className="transaction-result">
            <p className="selectable-text">
              <strong>Public Key:</strong> {transactionResult?.publicKey}
            </p>
            <p className="selectable-text">
              <strong>From:</strong> {transactionResult?.data.from}
            </p>
            <p className="selectable-text">
              <strong>To:</strong> {transactionResult?.data.to}
            </p>
            <p className="selectable-text">
              <strong>Amount:</strong> {transactionResult?.data.amount} MINA
            </p>
            <p className="selectable-text">
              <strong>Fee:</strong> {transactionResult?.data.fee} MINA
            </p>
            <p className="selectable-text">
              <strong>Nonce:</strong> {transactionResult?.data.nonce}
            </p>
            <p className="selectable-text">
              <strong>Memo:</strong> {transactionResult?.data.memo}
            </p>
            <p className="selectable-text">
              <strong>Valid Until:</strong> {transactionResult?.data.validUntil}
            </p>
            <p className="selectable-text">
              <strong>Signature Field:</strong>
              <div>{transactionResult?.signature.field}</div>
            </p>
            <p className="selectable-text">
              <strong>Signature Scalar:</strong> <div>{transactionResult?.signature.scalar}</div>
            </p>
          </div>
        </div>
      </ModalContainer>
    </div>
  );
}
