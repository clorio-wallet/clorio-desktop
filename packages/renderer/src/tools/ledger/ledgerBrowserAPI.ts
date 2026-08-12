// @ts-ignore
import Transporter from '@ledgerhq/hw-transport-webhid';
// @ts-ignore
import { MinaLedgerJS } from 'mina-ledger-js';
import {isElectron} from '../environment';
import type { ILedgerTransaction } from '../../types/LedgerDelegationTransaction';

// Wrapped Browser API for Ledger Devices

export const isMinaAppOpenCheck = async () => {
  if (isElectron()) {
    throw new Error('Wrong environment');
  }
  const transport = await Transporter.create();
  const instance = new MinaLedgerJS(transport);
  const appName = await instance.getAppName();
  transport.close();
  return appName;
};

/**
 * Get the wallet address based on the account number
 * @param account number
 * @returns string
 */
export const getPublicKey = async (account: number) => {
  if (isElectron()) {
    throw new Error('Wrong environment');
  }
  const transport = await Transporter.create();
  const instance = new MinaLedgerJS(transport);
  const address = await instance.getAddress(account);
  transport.close();
  return address;
};

export const signTransaction = async (transaction: ILedgerTransaction) => {
  if (isElectron()) {
    throw new Error('Wrong environment');
  }
  const transport = await Transporter.create();
  const instance = new MinaLedgerJS(transport);
  const signature = await instance.signTransaction(transaction);
  transport.close();
  return signature;
};
