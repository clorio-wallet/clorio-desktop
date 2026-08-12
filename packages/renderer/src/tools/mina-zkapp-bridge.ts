import {AES, enc} from 'crypto-js';
import {deriveWalletByMnemonic} from './mina';

BigInt.prototype['toJSON'] = function () {
  return this.toString();
};

export interface NetConfig {
  chainId: string;
  name: string;
  networkID: string;
}

export interface TransactionParams {
  isSpeedUp: boolean;
  memo: string;
}

export interface SignedTransaction {
  error?: string;
  // Add other properties of the signed transaction here
}

export interface IpcBridge {
  on: (eventName: string, callback: (event: any, data: any) => void) => void;
  off: (eventName: string, callback: (event: any, data: any) => void) => void;
  removeAllListeners: (eventName: string) => void;
  send: (eventName: string, data: string) => void;
  invoke: (eventName: string, data?: unknown) => Promise<unknown>;
  listenerCount: (eventName: string) => number;
}

declare global {
  interface Window {
    ipcBridge: IpcBridge;
  }
}

const WALLET_ACCOUNTS_KEY = 'walletAccounts';
const ENCRYPTED_DATA_KEY = 'encryptedData';

export const sendResponse = (eventName: string, data?: any) => {
  console.log(`Sending response for event: ${eventName}`);
  window.ipcBridge.send(eventName, typeof data !== 'string' ? JSON.stringify(data) : data);
};

export const getAccountAddress = (): string => {
  console.log('Getting account address...');
  const accountJson = localStorage.getItem(WALLET_ACCOUNTS_KEY);
  if (!accountJson) {
    console.error('No wallet accounts found in local storage');
    throw new Error('No wallet accounts found in local storage');
  }

  const accounts = JSON.parse(accountJson).map(account => {
    return account.address;
  });
  console.log(`Account address: ${accounts}`);
  return accounts;
};

export const getPrivateKey = async (password: string): Promise<string> => {
  console.log('Getting private key...');
  const encrypted = localStorage.getItem(ENCRYPTED_DATA_KEY);
  let privateKey = '';

  if (encrypted) {
    const mnemonic = AES.decrypt(encrypted, password).toString(enc.Utf8);
    privateKey = (await deriveWalletByMnemonic(mnemonic)).priKey;
  }

  return privateKey;
};
