import {Badge} from 'react-bootstrap';
import Spinner from '../UI/Spinner';
import {
  copyToClipboard,
  getTotalPages,
  openLinkOnBrowser,
  sanitizeString,
  trimMiddle,
} from '../../tools/utils';
import {useQuery} from '@apollo/client';
import Pagination from '../UI/pagination/Pagination';
import ReactTooltip from 'react-tooltip';
import {GET_BLACKLIST, GET_TRANSACTIONS_TOTAL} from '../../graphql/query';
import type {ITransactionTableProps, ITransactionTotalQueryResult} from './TransactionsTypes';
import TransactionsTableError from './TransactionsTableError';
import {formatUrl} from './TransactionsHelper';
import WalletCreationTransaction from './WalletCreationTransaction';
import RefetchTransactions from './RefetchTransactions';
import type {Blacklist} from '../../types/Blacklist';
import {getTimeDistance, humanAmount, isScamTransaction, toMINA, trimAddress} from '/@/tools';
import DataTable from 'react-data-table-component';
import TransactionIcon from './TransactionIcon';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import Avatar from '/@/tools/avatar/avatar';
import {ArrowRight, Copy} from 'react-feather';
import Button from '../UI/Button';

const customStyles = {
  rows: {
    highlightOnHoverStyle: {
      background: 'rgba(255, 255, 255, 0.1)',
    },
    style: {
      background: 'none',
      minHeight: '72px', // override the row height
    },
  },
  headCells: {
    style: {
      background: 'none',
      paddingLeft: '8px', // override the cell padding for head cells
      paddingRight: '8px',
    },
  },
  cells: {
    style: {
      background: 'none',
      paddingLeft: '8px', // override the cell padding for data cells
      paddingRight: '8px',
    },
  },
  table: {
    style: {
      backgroundColor: 'none',
    },
  },
  headRow: {
    style: {
      backgroundColor: 'none',
    },
  },
  pagination: {
    style: {
      backgroundColor: 'none',
      color: 'white',
    },
  },
};
const TransactionsTable = ({
  transactions,
  error,
  mempool,
  loading,
  userId,
  userAddress,
  page,
  setOffset,
  balance,
  refetchData,
}: ITransactionTableProps) => {
  const {data: totalData} = useQuery<ITransactionTotalQueryResult>(GET_TRANSACTIONS_TOTAL, {
    variables: {accountId: userId},
    skip: !userId || userId === -1,
    fetchPolicy: 'network-only',
  });

  const {data: blacklist} = useQuery<Blacklist>(GET_BLACKLIST, {
    fetchPolicy: 'network-only',
  });
  const {settings} = useNetworkSettingsContext();

  const columns = [
    {
      name: '',
      width: '80px',
      cell: row => {
        const {sender_public_key, receiver_public_key, command_type, failure_reason} = row;
        return TransactionIcon(
          command_type,
          sender_public_key,
          receiver_public_key,
          userAddress,
          isScamTransaction(
            blacklist?.blacklistedAddresses || [],
            sender_public_key,
            receiver_public_key,
          ),
          !!failure_reason,
          failure_reason,
        );
      },
    },
    {
      name: 'Status',
      width: '150px',
      cell: row => {
        const {isMempool, failure_reason, sender_public_key, receiver_public_key} = row;
        const isScam = isScamTransaction(
          blacklist?.blacklistedAddresses || [],
          sender_public_key,
          receiver_public_key,
        );
        const color = isScam
          ? 'danger'
          : isMempool
          ? 'secondary-alt'
          : failure_reason
          ? 'danger-alt'
          : 'success-alt';
        blacklist?.blacklistedAddresses?.reduce((previous, actual) => {
          if (actual.address === receiver_public_key) {
            senderScam = 1;
          }
          return (
            previous ||
            actual.address === sender_public_key ||
            actual.address === receiver_public_key
          );
        }, false);
        return (
          <div className="flex flex-col justify-center items-start gap-2">
            <Badge
              bg={color}
              className="medium-table-value-text"
            >
              {isScam ? 'Scam' : isMempool ? 'Pending' : failure_reason ? 'Failed' : 'Confirmed'}
            </Badge>
            {failure_reason && (
              <div className="small-table-value-text opacity-5">{failure_reason}</div>
            )}
          </div>
        );
      },
    },
    {
      name: 'Hash',
      minWidth: '280px',
      cell: row => (
        <div className="table-value-text flex flex-col flex-start">
          <div
            className={`${
              row.type !== 'create_account' ? 'purple-hover' : ''
            } table-value-text bold flex justify-center items-center gap-2`}
          >
            <span
              onClick={() =>
                row.type !== 'create_account' &&
                !row.isMempool &&
                openLinkOnBrowser(formatUrl(row.hash, settings?.explorerUrl))
              }
            >
              {trimMiddle(row.hash, 20)}
            </span>
            {row.type !== 'create_account' && (
              <Button
                className="inline-element"
                icon={<Copy size={20} />}
                onClick={() => copyToClipboard(row.hash)}
              />
            )}
          </div>
          <div className="small-table-value-text opacity-5">
            {row.memo ? `Memo: ${sanitizeString(row.memo)}` : null}
          </div>
        </div>
      ),
    },
    {
      name: 'Sender',
      minWidth: '250px',
      cell: row => {
        const isScam = isScamTransaction(
          blacklist?.blacklistedAddresses || [],
          row.sender_public_key,
          row.receiver_public_key,
        );
        return (
          <div className="flex w-100 flex-col gap-1">
            <div className="flex justify-between w-100">
              <div className="flex gap-2 items-center justify-start">
                <Avatar
                  size={30}
                  address={row.sender_public_key}
                />{' '}
                <a
                  className="purple-hover table-value-text bold"
                  onClick={() =>
                    !row.isMempool &&
                    openLinkOnBrowser(formatUrl(row.sender_public_key, settings?.explorerUrl, true))
                  }
                >
                  {row.sender_public_key === userAddress
                    ? `${trimAddress(row.sender_public_key)} (You)`
                    : trimAddress(row.sender_public_key)}
                </a>
              </div>
            </div>
            {isScam && (
              <p className="small-table-value-text">
                <strong data-tip={row.sender_public_key}>Sender</strong> reported as a scammer!
              </p>
            )}
          </div>
        );
      },
    },
    {
      minWidth: '75px',
      maxWidth: '100px',
      cell: () => (
        <div className="flex w-100 justify-center">
          <ArrowRight />
        </div>
      ),
    },
    {
      name: 'Recipient',
      minWidth: '250px',
      cell: ({receiver_public_key, sender_public_key, isMempool}) => {
        const isScam = isScamTransaction(
          blacklist?.blacklistedAddresses || [],
          sender_public_key,
          receiver_public_key,
        );

        return (
          <div className="flex w-100 flex-col gap-1">
            <div className="flex gap-2 items-center justify-start ">
              <Avatar
                size={30}
                address={receiver_public_key}
              />{' '}
              <a
                className="purple-hover table-value-text bold"
                onClick={() =>
                  !isMempool &&
                  openLinkOnBrowser(formatUrl(receiver_public_key, settings?.explorerUrl, true))
                }
              >
                {receiver_public_key === userAddress
                  ? `${trimAddress(receiver_public_key)} (You)`
                  : trimAddress(receiver_public_key)}
              </a>
            </div>
            {isScam && (
              <p className="small-table-value-text">
                <strong data-tip={receiver_public_key}>Recipient</strong> reported as a scammer!
              </p>
            )}
          </div>
        );
      },
    },
    {
      name: 'Amount',
      width: '150px',
      cell: ({sender_public_key, amount, receiver_public_key, command_type, fee}) => {
        const totalAmount = humanAmount(
          amount,
          sender_public_key === userAddress,
          sender_public_key === receiver_public_key,
          command_type,
        );
        return (
          <div className="table-value-text flex flex-col flex-start">
            <div>{amount ? `${totalAmount} Mina` : '0 Mina'}</div>
            <div className="small-table-value-text opacity-5">
              {fee ? `${toMINA(fee)} Mina Fee` : ''}
            </div>
          </div>
        );
      },
    },
    {
      name: 'Nonce',
      width: '80px',
      cell: ({nonce}) => <span className="medium-table-value-text text-start">{nonce}</span>,
    },
    {
      name: 'Age',
      cell: ({timestamp, type}) => (
        <span className="medium-table-value-text text-start">
          {type !== 'create_account' && getTimeDistance(+timestamp, false)}
        </span>
      ),
    },
  ];

  if (
    !loading &&
    (error ||
      !transactions ||
      transactions?.transactions === null ||
      (transactions?.transactions && transactions?.transactions.length === 0) ||
      !totalData ||
      totalData?.transactionsCount?.count === 0)
  ) {
    return TransactionsTableError(balance, error, refetchData);
  }

  const formatMempool = () => {
    const result = [];
    if (page === 1) {
      if (mempool?.mempool && mempool?.mempool?.length > 0) {
        mempool?.mempool?.map(row => {
          result.push({
            ...row,
            type: 'mempool',
            sender_public_key: row.source?.publicKey,
            receiver_public_key: row.receiver?.publicKey,
            amount: row.amount,
            hash: row.id,
            timestamp: row.timestamp,
            status: 'mempool',
            command_type: row.kind,
            failure_reason: '',
            isMempool: true,
          });
        });
      }
    }
    return result;
  };

  const mergeTansactions = () => {
    const returnData = [...formatMempool()];
    for (let i = 0; i < transactions?.transactions?.length; i++) {
      returnData.push(transactions?.transactions[i]);
    }
    if (page == getTotalPages(totalData?.transactionsCount?.count || 0)) {
      returnData.push({
        id: '0',
        amount: 1000000000,
        sender_public_key: userAddress,
        receiver_public_key: '',
        hash: 'Wallet creation fee',
        status: 'confirmed',
        command_type: 'create_account',
        type: 'create_account',
        failure_reason: '',
        isMempool: false,
      });
    }
    return returnData;
  };

  return (
    <div className="glass-card px-4 pt-3 mb-5 pb-3">
      <Spinner
        className={'full-width'}
        show={loading}
      >
        <>
          <RefetchTransactions refetch={refetchData} />
          <ReactTooltip multiline={true} />
          <DataTable
            columns={columns}
            data={mergeTansactions()}
            highlightOnHover
            persistTableHead
            responsive
            subHeaderWrap
            customStyles={customStyles}
          />
          <Pagination
            page={page}
            setOffset={setOffset}
            total={getTotalPages(totalData?.transactionsCount?.count || 0)}
          />
        </>
      </Spinner>
    </div>
  );
};

export default TransactionsTable;
