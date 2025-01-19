// import { signPayment } from "@o1labs/client-sdk";
import {formatDistance} from 'date-fns';
import type {IKeypair} from '../types/Keypair';
import type {ISignature} from '../types/Signature';
import type {ITransactionPayload} from '../types/TransactionPayload';
import {client, toMINA} from './mina';

interface ISignTransaction {
  transactionData: any;
  keypair: IKeypair;
  sender: string;
  actualNonce: number;
}

/**
 * Sign transaction through MinaSDK
 * @param object
 * @returns
 */
export const signTransaction = async ({
  transactionData,
  keypair,
  sender,
  actualNonce,
}: ISignTransaction) => {
  const {fee, amount, receiverAddress, memo} = transactionData;
  const signedPayment = (await client()).signPayment(
    {
      from: sender,
      to: receiverAddress,
      amount,
      fee,
      nonce: actualNonce,
      memo,
    },
    keypair.privateKey,
  );

  return signedPayment;
};

export const createSignatureInputFromSignature = (signature: ISignature) => {
  return {
    scalar: signature.scalar,
    field: signature.field,
  };
};

export const createPaymentInputFromPayload = (payload: ITransactionPayload) => {
  return {
    nonce: payload.nonce,
    memo: payload.memo,
    fee: payload.fee,
    amount: payload.amount,
    to: payload.to,
    from: payload.from,
  };
};

export const createDelegationPaymentInputFromPayload = (payload: ITransactionPayload) => {
  return {
    nonce: payload.nonce,
    fee: payload.fee,
    validUntil: payload.validUntil,
    to: payload.to,
    from: payload.from,
  };
};

export const isSelfTransaction = (sender: string, receiver: string) => {
  return sender === receiver;
};

export const isScamTransaction = (blacklist: string[], sender: string, receiver: string) => {
  let isScam = false;
  if (blacklist.includes(sender) || blacklist.includes(receiver)) {
    isScam = true;
  }
  return isScam;
};

export const isOutgoingTransaction = (userAddress: string, sender: string) => {
  return userAddress === sender;
};

export const getTimeDistance = (timestamp: number, isMempool?: boolean) => {
  const timeDistance =
    !isMempool && timestamp
      ? formatDistance(+timestamp, new Date(), {
          includeSeconds: true,
          addSuffix: true,
        })
      : 'Waiting for confirmation';
  return timeDistance;
};

export const timeISOString = (timestamp: number, isMempool?: boolean) =>
  !isMempool && timestamp ? new Date(+timestamp).toISOString() : '';

export const humanAmount = (amount: number, isOutgoing: boolean, isSelf: boolean, type: string) =>
  isOutgoing
    ? isSelf || type === 'delegation'
      ? toMINA(+amount)
      : `-${toMINA(+amount)}`
    : `${toMINA(+amount)}`;

export const amountColorTransaction = (isOutgoing: boolean, isSelf: boolean, type: string) =>
  isOutgoing ? (isSelf || type === 'delegation' ? '' : 'red-text') : 'green-text';

export const trimAddress = (address: string) => {
  return address ? `${address?.slice(0, 6)}...${address?.slice(-6)}` : 'Missing recipient';
};
