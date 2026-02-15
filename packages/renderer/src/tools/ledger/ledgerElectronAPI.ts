let invoke: any;
import {isElectron} from '../environment';
import type {ILedgerTransaction} from '../../types/LedgerDelegationTransaction';

// Wrapped Electron API for Ledger Devices

if (isElectron()) {
  // Import the node-hid
  // @ts-ignore
  invoke = window.ipcBridge.invoke;
}

export const isMinaAppOpenCheck = async () => {
  if (!isElectron()) {
    throw new Error('Wrong environment');
  }
  return await invoke('ledger-get-name-version');
};
export const getPublicKey = async (account: number) => {
  if (!isElectron()) {
    throw new Error('Wrong environment');
  }
  return await invoke('ledger-get-address', account);
};
export const signTransaction = async (transaction: ILedgerTransaction) => {
  if (!isElectron()) {
    throw new Error('Wrong environment');
  }
  return await invoke('ledger-sign-transaction', transaction);
};
