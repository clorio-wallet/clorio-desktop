import {useState} from 'react';
import type {ITransactionData} from '../../../types/TransactionData';
import {toLongMINA, trimMiddle} from '../../../tools';
import {ArrowLeft, ArrowRight} from 'react-feather';
import Avatar from '../../../tools/avatar/avatar';
import './ConfirmTransaction.scss';
import Button from '../Button';

interface IProps {
  transactionData: ITransactionData;
  sendTransaction: () => void;
  stepBackward: () => void;
  walletAddress: string;
  isLedgerEnabled?: boolean;
  isLoading?: boolean;
  ledgerTransactionData: any;
}

export const ConfirmTransaction = ({
  stepBackward,
  sendTransaction,
  transactionData,
  isLoading = false,
  walletAddress,
}: IProps) => {
  const {amount, fee, receiverAddress, memo} = transactionData;
  const [isConfirming, setIsConfirming] = useState(false);
  const totalAmount = (+amount || 0) + (+fee || 0);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await sendTransaction();
    } finally {
      setIsConfirming(false);
    }
  };

  const isDisabled = isLoading || isConfirming;

  return (
    <div className="confirm-transaction">
      <div className="confirm-transaction__header">
        <span className="confirm-transaction__eyebrow">Final review</span>
        <h2 className="confirm-transaction__title">Confirm transaction</h2>
        <p className="confirm-transaction__subtitle">
          Verify the amount, fee, and destination before broadcasting.
        </p>
      </div>

      <div className="confirm-transaction__body">
        <section className="confirm-transaction__summary">
          <div className="confirm-transaction__summary-row confirm-transaction__summary-row--total">
            <span className="confirm-transaction__amount-label">Total to spend</span>
            <span className="confirm-transaction__amount-value">
              {toLongMINA(totalAmount)} MINA
            </span>
          </div>
          <div className="confirm-transaction__summary-grid">
            <div className="confirm-transaction__summary-card">
              <span className="confirm-transaction__amount-label">Amount</span>
              <span className="confirm-transaction__amount-value">{toLongMINA(amount)} MINA</span>
            </div>
            <div className="confirm-transaction__summary-card">
              <span className="confirm-transaction__amount-label">Network fee</span>
              <span className="confirm-transaction__amount-value">{toLongMINA(fee)} MINA</span>
            </div>
          </div>
        </section>

        <section className="confirm-transaction__recipient">
          <span className="confirm-transaction__section-label">Recipient</span>
          <div className="confirm-transaction__recipient-card">
            <div className="confirm-transaction__route">
              <span className="confirm-transaction__route-label">To</span>
              <span
                className="confirm-transaction__route-value"
                title={receiverAddress}
              >
                {trimMiddle(receiverAddress, 32)}
                <div className="confirm-transaction__avatar">
                  <Avatar
                    address={receiverAddress}
                    size={32}
                  />
                </div>
              </span>
            </div>
            <div className="confirm-transaction__route confirm-transaction__route-border">
              <span className="confirm-transaction__route-label">From</span>
              <span
                className="confirm-transaction__route-value"
                title={walletAddress}
              >
                {trimMiddle(walletAddress, 32)}
                <div className="confirm-transaction__avatar">
                  <Avatar
                    address={walletAddress}
                    size={32}
                  />
                </div>
              </span>
            </div>
          </div>
        </section>

        {memo && (
          <section className="confirm-transaction__memo">
            <span className="confirm-transaction__section-label">Memo</span>
            <p className="confirm-transaction__memo-text">{memo}</p>
          </section>
        )}
      </div>

      <div className="confirm-transaction__actions">
        <Button
          className="confirm-transaction__back"
          style="no-style"
          onClick={stepBackward}
          disabled={isDisabled}
          icon={<ArrowLeft size={16} />}
          text="Back"
        />
        <Button
          style="primary"
          onClick={handleConfirm}
          disabled={isDisabled}
          loading={isConfirming}
          icon={!isConfirming ? <ArrowRight size={16} /> : undefined}
          appendIcon
          text={isConfirming ? 'Confirming...' : 'Confirm'}
        />
      </div>
    </div>
  );
};
