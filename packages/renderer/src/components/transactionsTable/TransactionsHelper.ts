import {toMINA} from '../../tools';
import type {IMempoolQueryData, ITransactionQueryData} from './TransactionsTypes';

/**
 * Take the mempool query result object and convert it to a table row object
 * @param mempoolRow
 * @returns ITransactionRowData
 */
export const mempoolQueryRowToTableRow = (mempoolRow: IMempoolQueryData) => {
  const id = mempoolRow.id;
  const amount = mempoolRow.amount ? toMINA(mempoolRow.amount) : 0;
  const sender = mempoolRow.source && mempoolRow.source.publicKey;
  const receiver = mempoolRow.receiver && mempoolRow.receiver.publicKey;
  const isSelf = receiver === sender;
  const fee = 'Fee : ' + (mempoolRow.fee ? +toMINA(+mempoolRow.fee) : 0) + ' Mina';
  const memo = mempoolRow.memo;
  const type = mempoolRow.kind === 'STAKE_DELEGATION' ? 'delegation' : 'payment';
  return {
    id,
    amount,
    sender,
    receiver,
    isSelf,
    fee,
    memo,
    type,
  };
};

/**
 * Take the transactions query result object and convert it to a table row object
 * @param transactionRow
 * @returns ITransactionRowData
 */
export const transactionQueryRowToTableRow = (transactionRow: ITransactionQueryData) => {
  const {timestamp, status, failure_reason} = transactionRow;
  const id = transactionRow.hash;
  const amount = transactionRow.amount ? toMINA(transactionRow.amount) : 0;
  const sender = transactionRow.sender_public_key;
  const receiver = transactionRow.receiver_public_key;
  const fee = 'Fee : ' + (transactionRow.fee ? +toMINA(transactionRow.fee) : 0) + ' Mina';
  const type = transactionRow.command_type;
  const isSelf = receiver === sender;
  const memo = transactionRow.memo;
  const failed = status === 'failed';
  return {
    id,
    amount,
    sender,
    receiver,
    isSelf,
    fee,
    memo,
    timestamp,
    type,
    status,
    failure_reason,
    failed,
  };
};

export const formatUrl = (txId: string, url?: string, isWallet?: boolean) => {
  if (url.includes('minascan.io')) {
    if (isWallet) {
      return `${url}account/${txId}`;
    }
    return `${url}tx/${txId}`;
  } else {
    if (isWallet) {
      return `${url}wallet/${txId}`;
    }
    return `${url}transaction/${txId}`;
  }
};
