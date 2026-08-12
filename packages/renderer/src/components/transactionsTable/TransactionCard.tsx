import * as React from 'react';
import {formatDistance} from 'date-fns';
import {openLinkOnBrowser, sanitizeString, trimMiddle, copyToClipboard} from '../../tools';
import type {BlacklistedAddress} from '../../types/Blacklist';
import TransactionIcon from './TransactionIcon';
import type {ITransactionRowData} from './TransactionsTypes';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import {formatUrl} from './TransactionsHelper';
import {Copy} from 'react-feather';
import {toast} from 'react-toastify';

interface IProps {
  rowData: ITransactionRowData;
  index: number;
  userAddress: string;
  blacklist: BlacklistedAddress[];
  isMempool: boolean;
}

const TransactionCard: React.FC<IProps> = ({rowData, index, userAddress, blacklist, isMempool}) => {
  const {timestamp, amount, sender, receiver, memo, id, type, failed, failure_reason} = rowData;

  const isScam = blacklist.some(addr => addr.address === sender || addr.address === receiver);

  const timeDistance =
    !isMempool && timestamp
      ? formatDistance(+timestamp, new Date(), {
          includeSeconds: false,
          addSuffix: true,
        })
      : 'Awaiting';

  const isOutgoing = userAddress === sender;
  const isSelf = receiver === sender;
  const humanAmount = isOutgoing
    ? isSelf || type === 'delegation'
      ? amount
      : `-${amount}`
    : `+${amount}`;

  const amountClass = isOutgoing
    ? isSelf || type === 'delegation'
      ? 'amount--neutral'
      : 'amount--outgoing'
    : 'amount--incoming';

  const directionClass = isSelf
    ? 'direction--self'
    : isOutgoing
      ? 'direction--outgoing'
      : 'direction--incoming';

  const directionLabel = isSelf ? 'Self' : isOutgoing ? 'Sent' : 'Received';

  const {settings} = useNetworkSettingsContext();

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    copyToClipboard(text);
    toast.success(`${label} copied`);
  };

  const handleOpenExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMempool) {
      openLinkOnBrowser(formatUrl(id, settings?.explorerUrl));
    }
  };

  const cardClasses = ['tx-card', isMempool ? 'tx-card--mempool' : '', isScam ? 'tx-card--scam' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClasses}
      style={{'--tx-index': index} as React.CSSProperties}
    >
      <div
        className="tx-card__main"
        onClick={handleOpenExplorer}
      >
        <div className="tx-card__left">
          <div className="tx-card__icon-wrap">
            {TransactionIcon(type, sender, receiver, userAddress, isScam, failed, failure_reason)}
          </div>
          <div className="tx-card__info">
            <span className={`tx-card__amount ${amountClass}`}>{humanAmount} MINA</span>
            <span className={`tx-card__direction ${directionClass}`}>{directionLabel}</span>
          </div>
        </div>
        <div className="tx-card__right">
          {isMempool ? (
            <span className="tx-card__pending">
              <span className="tx-card__pending-dot" />
              Pending
            </span>
          ) : (
            <span className="tx-card__time">{timeDistance}</span>
          )}
        </div>
      </div>

      <div className="tx-card__addresses">
        <div className="tx-card__addr-row">
          <span className="tx-card__addr-label">From</span>
          <span className={`tx-card__addr-value ${sender === userAddress ? 'is-you' : ''}`}>
            {sender === userAddress ? 'You' : trimMiddle(sender, 20)}
          </span>
          {sender !== userAddress && (
            <button
              className="tx-card__copy"
              onClick={e => handleCopy(e, sender, 'Sender')}
              aria-label="Copy sender"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
        <div className="tx-card__addr-row">
          <span className="tx-card__addr-label">To</span>
          <span className={`tx-card__addr-value ${receiver === userAddress ? 'is-you' : ''}`}>
            {receiver === userAddress ? 'You' : trimMiddle(receiver, 20)}
          </span>
          {receiver !== userAddress && (
            <button
              className="tx-card__copy"
              onClick={e => handleCopy(e, receiver, 'Receiver')}
              aria-label="Copy receiver"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="tx-card__footer">
        <button
          className="tx-card__hash-btn"
          onClick={e => handleCopy(e, id, 'Transaction ID')}
        >
          <Copy size={12} />
          <span>{trimMiddle(id, 16)}</span>
        </button>
      </div>

      {memo && (
        <div className="tx-card__memo">
          <span className="tx-card__addr-label">Memo</span>
          <span className="tx-card__memo-text">{sanitizeString(memo)}</span>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
