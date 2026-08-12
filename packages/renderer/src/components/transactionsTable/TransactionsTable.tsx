import React, {useMemo} from 'react';
import Spinner from '../UI/Spinner';
import {getTotalPages} from '../../tools/utils';
import {useQuery} from '@apollo/client';
import Pagination from '../UI/pagination/Pagination';
import ReactTooltip from 'react-tooltip';
import {GET_BLACKLIST, GET_TRANSACTIONS_TOTAL} from '../../graphql/query';
import type {
  ITransactionRowData,
  ITransactionTableProps,
  ITransactionTotalQueryResult,
} from './TransactionsTypes';
import TransactionRow from './TransactionRow';
import TransactionCard from './TransactionCard';
import TransactionsTableError from './TransactionsTableError';
import {mempoolQueryRowToTableRow, transactionQueryRowToTableRow} from './TransactionsHelper';
import WalletCreationTransaction from './WalletCreationTransaction';
import RefetchTransactions from './RefetchTransactions';
import type {Blacklist} from '../../types/Blacklist';
import {TRANSACTIONS_TABLE_ITEMS_PER_PAGE} from '/@/tools';
import './TransactionsTable.scss';

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

  const blacklistAddresses = blacklist?.blacklistedAddresses || [];

  const mempoolCount = mempool?.mempool?.length || 0;

  const mempoolRows = useMemo(
    () =>
      mempool?.mempool?.map((row, idx) => {
        const rowData: ITransactionRowData = mempoolQueryRowToTableRow(row);
        return (
          <TransactionRow
            key={`mempool-tx-${idx}`}
            rowData={rowData}
            index={idx}
            userAddress={userAddress}
            blacklist={blacklistAddresses}
            isMempool={true}
          />
        );
      }) || [],
    [mempool, userAddress, blacklistAddresses],
  );

  const mempoolCards = useMemo(
    () =>
      mempool?.mempool?.map((row, idx) => {
        const rowData: ITransactionRowData = mempoolQueryRowToTableRow(row);
        return (
          <TransactionCard
            key={`mempool-card-${idx}`}
            rowData={rowData}
            index={idx}
            userAddress={userAddress}
            blacklist={blacklistAddresses}
            isMempool={true}
          />
        );
      }) || [],
    [mempool, userAddress, blacklistAddresses],
  );

  const txRows = useMemo(
    () =>
      transactions?.transactions?.map((row, idx) => {
        const rowData: ITransactionRowData = transactionQueryRowToTableRow(row);
        return (
          <TransactionRow
            key={`tx-${idx}`}
            rowData={rowData}
            index={mempoolCount + idx}
            userAddress={userAddress}
            blacklist={blacklistAddresses}
            isMempool={false}
          />
        );
      }) || [],
    [transactions, userAddress, blacklistAddresses, mempoolCount],
  );

  const txCards = useMemo(
    () =>
      transactions?.transactions?.map((row, idx) => {
        const rowData: ITransactionRowData = transactionQueryRowToTableRow(row);
        return (
          <TransactionCard
            key={`tx-card-${idx}`}
            rowData={rowData}
            index={mempoolCount + idx}
            userAddress={userAddress}
            blacklist={blacklistAddresses}
            isMempool={false}
          />
        );
      }) || [],
    [transactions, userAddress, blacklistAddresses, mempoolCount],
  );

  const walletCreationRow = useMemo(() => {
    const totalRows = totalData?.transactionsCount?.count || 0;
    const isLastPage = +page === +getTotalPages(totalRows);
    if (transactions?.transactions?.length) {
      if (transactions?.transactions?.length < TRANSACTIONS_TABLE_ITEMS_PER_PAGE || isLastPage) {
        return WalletCreationTransaction(totalRows + 1);
      }
    }
    return null;
  }, [transactions, totalData, page]);

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

  return (
    <div className="glass-card px-4 pt-3 mb-5 pb-3">
      <Spinner
        className={'full-width'}
        show={loading}
      >
        <ReactTooltip multiline={true} />
        <RefetchTransactions refetch={refetchData} />

        <div className="tx-table-container">
          <table className="tx-table animate__animated animate__fadeIn">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">Transaction</th>
                <th scope="col">Date</th>
                <th scope="col">From</th>
                <th scope="col">To</th>
                <th
                  scope="col"
                  className="text-right"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {mempoolRows}
              {txRows}
              {walletCreationRow}
            </tbody>
          </table>
        </div>

        <div className="tx-card-list animate__animated animate__fadeIn">
          {mempoolCards}
          {txCards}
        </div>

        <Pagination
          page={page}
          setOffset={setOffset}
          total={getTotalPages(totalData?.transactionsCount?.count || 0)}
        />
      </Spinner>
    </div>
  );
};

export default TransactionsTable;
