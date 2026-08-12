import * as React from 'react';
import {formatDistance} from 'date-fns';
import {openLinkOnBrowser, sanitizeString, trimMiddle, copyToClipboard} from '../../tools';
import type {BlacklistedAddress} from '../../types/Blacklist';
import TransactionIcon from './TransactionIcon';
import type {ITransactionRowData} from './TransactionsTypes';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import {formatUrl} from './TransactionsHelper';
import {Copy} from 'react-feather';

interface IProps {
  rowData: ITransactionRowData;
  index: number;
  userAddress: string;
  blacklist: BlacklistedAddress[];
  isMempool: boolean;
}

const TransactionRow: React.FC<IProps> = ({rowData, index, userAddress, blacklist, isMempool}) => {
  const {timestamp, amount, sender, receiver, memo, id, type, failed, failure_reason} = rowData;

  let senderScam = 0;
  const isScam = blacklist.reduce((previous, actual) => {
    if (actual.address === receiver) {
      senderScam = 1;
    }
    return previous || actual.address === sender || actual.address === receiver;
  }, false);

  const timeDistance =
    !isMempool && timestamp
      ? formatDistance(+timestamp, new Date(), {
          includeSeconds: true,
          addSuffix: true,
        })
      : 'Waiting for confirmation';

  const timeISOString = !isMempool && timestamp ? new Date(+timestamp).toISOString() : '';
  const isOutgoing = userAddress === sender;
  const isSelf = receiver === sender;
  const humanAmount = isOutgoing
    ? isSelf || type === 'delegation'
      ? amount
      : `-${amount}`
    : `+${amount}`;
  const amountColor = isOutgoing
    ? isSelf || type === 'delegation'
      ? ''
      : 'red-text'
    : 'green-text';

  const {settings} = useNetworkSettingsContext();

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    copyToClipboard(text);
  };

  return (
    <tr
      key={index}
      className={`${isScam ? 'dangerous-transaction' : ''} hover-row`}
    >
      <td className="table-element table-icon align-middle">
        {TransactionIcon(type, sender, receiver, userAddress, isScam, failed, failure_reason)}
      </td>
      <td className="table-element table-hash align-middle">
        <div className="d-flex align-items-center">
          <a
            onClick={() => !isMempool && openLinkOnBrowser(formatUrl(id, settings?.explorerUrl))}
            target="_blank"
            rel="noreferrer"
            className="purple-text font-weight-medium mr-2"
            style={{cursor: 'pointer'}}
            data-tip={memo ? `Memo: ${sanitizeString(memo)}` : id}
          >
            {trimMiddle(id, 24)}
          </a>
          <Copy
            size={14}
            className="cursor-pointer text-muted hover-primary"
            onClick={e => handleCopy(e, id)}
            data-tip="Copy Transaction Hash"
          />
        </div>
      </td>
      <td
        className="table-element align-middle"
        data-tip={timeISOString}
      >
        <span className="text-muted small font-weight-bold">{timeDistance}</span>
      </td>
      <td className="table-element align-middle">
        <div className="d-flex align-items-center">
          <span
            className="mr-2"
            data-tip={sender}
          >
            {sender === userAddress ? 'You' : trimMiddle(sender, 24)}
          </span>
          {sender !== userAddress && (
            <Copy
              size={14}
              className="cursor-pointer text-muted hover-primary"
              onClick={e => handleCopy(e, sender)}
              data-tip="Copy Sender Address"
            />
          )}
        </div>
      </td>
      <td className="table-element align-middle">
        <div className="d-flex align-items-center">
          <span
            className="mr-2 trim-receiver"
            data-tip={receiver}
          >
            {receiver === userAddress ? 'You' : trimMiddle(receiver, 24)}
          </span>
          {receiver !== userAddress && (
            <Copy
              size={14}
              className="cursor-pointer text-muted hover-primary"
              onClick={e => handleCopy(e, receiver)}
              data-tip="Copy Receiver Address"
            />
          )}
        </div>
      </td>
      <td className={`table-element align-middle font-weight-bold ${amountColor}`}>
        {humanAmount} MINA
      </td>
    </tr>
  );
};

export default TransactionRow;
