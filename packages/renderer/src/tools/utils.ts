import Big from 'big.js';
import {isElectron} from './environment';
import {toast} from 'react-toastify';
import BadWords from 'bad-words';
import Censorify from 'censorify-it';
import {UpdateError} from '../components/UI/UpdateError';
import {toNanoMINA} from './mina';
import {DEFAULT_VALID_UNTIL_FIELD, TRANSACTIONS_TABLE_ITEMS_PER_PAGE, MINIMUM_FEE} from './const';
import {VALIDATORS_TABLE_ITEMS_PER_PAGE} from './const/transactions';
import {wordlists} from 'bip39';
import {getCurrentNetConfig} from './zkapp';
import * as bs58check from 'bs58check';

const shortUrls: string[] = [];
const blacklist = ['onion'];

export declare const DAppActions: {
  mina_requestAccounts: string;
  mina_accounts: string;
  mina_sendPayment: string;
  mina_sendStakeDelegation: string;
  mina_signMessage: string;
  mina_verifyMessage: string;
  mina_requestNetwork: string;
  mina_sendTransaction: string;
  mina_signFields: string;
  mina_verifyFields: string;
  mina_sign_JsonMessage: string;
  mina_verify_JsonMessage: string;
  mina_switchChain: string;
  mina_createNullifier: string;
  mina_addChain: string;
};

/** coin config */
export const MAIN_COIN_CONFIG = {
  name: 'MINA',
  segwitAvailable: true,
  coinType: 12586,
  network: null,
  symbol: 'MINA',
  decimals: 9,
};

export const copyToClipboard = (content = '') => {
  const el = document.createElement('textarea');
  el.value = content.trim();
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

/**
 * Set the class to show the error message "Smaller screen support is coming soon"
 */
export const initHtmlElements = () => {
  document.getElementsByClassName('show-on-load')[0].className = 'show-mob';
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.display = 'none';
  }

  if (navigator.userAgent.indexOf('Electron') >= 0) {
    document.getElementById('draggable-bar')?.classList.add('electron');
  }
};

/**
 * Check if the object is empty
 * @param object
 * @returns boolean
 */
export const isEmptyObject = (objectToCheck: any) => {
  return (
    objectToCheck &&
    Object.entries(objectToCheck).length === 0 &&
    objectToCheck.constructor === Object
  );
};

export const toDecimal = (amount: number) => {
  return Big(amount).mul(1e-9).toFixed(3);
};

export const getDefaultValidUntilField = () => {
  return DEFAULT_VALID_UNTIL_FIELD;
};

/**
 * Get the number of the transactions table and validators table pages based on the total number of elements
 * @returns Number
 */
export const getTotalPages = (totalItems = 0, transactions = true) => {
  const itemsPerPage = transactions
    ? TRANSACTIONS_TABLE_ITEMS_PER_PAGE
    : VALIDATORS_TABLE_ITEMS_PER_PAGE;
  const halfItemsPerPage = itemsPerPage / 2;
  if (totalItems) {
    const pages = (totalItems / itemsPerPage).toFixed(0);
    if (totalItems % itemsPerPage < halfItemsPerPage && totalItems % itemsPerPage !== 0) {
      return parseInt(pages) === 0 ? 1 : parseInt(pages) + 1;
    }
    return parseInt(pages) === 0 ? 1 : pages;
  }
  return 1;
};

/**
 * Calculate page from the offset
 * @param {number} offset
 * @returns number
 */
export const getPageFromOffset = (offset = 0) => {
  return offset / TRANSACTIONS_TABLE_ITEMS_PER_PAGE + 1;
};

/**
 * Check if the fee is greater than the minimum
 * @param fee number
 * @returns boolean
 */
export const feeGreaterThanMinimum = (fee: number) => {
  if (fee) {
    const feeToSend = toNanoMINA(fee);
    const feeMinusMinimum = +Big(feeToSend).sub(MINIMUM_FEE);
    if (feeMinusMinimum >= 0) {
      return true;
    }
  }
  return false;
};

export const isDevnet = () => {
  return import.meta.env.VITE_REACT_APP_NETWORK === 'devnet';
};

export const electronAlerts = async () => {
  const alerts: string[] = [];

  if (isElectron()) {
    let updateChecked = false;
    // @ts-ignore
    const ipcOn = window.ipcBridge.on;
    // @ts-ignore
    const ipcSend = window.ipcBridge.send;
    ipcSend('CHECK_FOR_UPDATE_PENDING');
    ipcOn('CHECK_FOR_UPDATE_SUCCESS', async (_: any, version: string) => {
      updateChecked = true;
      if (!alerts.includes('CHECK_FOR_UPDATE_SUCCESS')) {
        const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
        if (macosPlatforms.includes(window.navigator.platform)) {
          toast.info(UpdateError({version}), {
            toastId: 'CHECK_FOR_UPDATE_SUCCESS',
            autoClose: 10000,
          });
          alerts.push('CHECK_FOR_UPDATE_SUCCESS');
          alerts.push('UPDATE_ERROR');
          alerts.push('DOWNLOAD_UPDATE_FAILURE');
          alerts.push('DOWNLOAD_UPDATE_SUCCESS');
        } else {
          toast.info(`There is a new release 🎉 v${version}`, {
            toastId: 'CHECK_FOR_UPDATE_SUCCESS',
          });
          alerts.push('CHECK_FOR_UPDATE_SUCCESS');
        }
      }
    });
    ipcOn('UPDATE_ERROR', () => {
      if (!alerts.includes('UPDATE_ERROR') && updateChecked) {
        toast.error('There was an error while updating the app', {
          toastId: 'UPDATE_ERROR',
        });
        alerts.push('UPDATE_ERROR');
      }
    });
    ipcOn('DOWNLOAD_UPDATE_SUCCESS', () => {
      if (!alerts.includes('DOWNLOAD_UPDATE_SUCCESS')) {
        toast.success('Clorio successfully downloaded', {
          toastId: 'DOWNLOAD_UPDATE_SUCCESS',
        });
        alerts.push('DOWNLOAD_UPDATE_SUCCESS');
      }
    });
    ipcOn('DOWNLOAD_UPDATE_FAILURE', () => {
      if (!alerts.includes('DOWNLOAD_UPDATE_FAILURE')) {
        toast.error('There was an error while updating', {
          toastId: 'DOWNLOAD_UPDATE_FAILURE',
        });
        alerts.push('DOWNLOAD_UPDATE_FAILURE');
      }
    });
  }
};

export const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

export const isBad = (value: string): boolean => {
  if (!value) {
    return false;
  }

  const alphaValue = value.replace(/[^a-zA-Z0-9]/g, '');

  for (const bad of blacklist.concat(shortUrls)) {
    const badDirectly = alphaValue.includes(bad);
    const badVariation = alphaValue.includes(bad.replace(/[^a-zA-Z0-9]/g, ''));

    if (badDirectly || badVariation) {
      return true;
    }
  }

  return false;
};

const isAlphaNumericSpace = (text: string) => {
  return text.match('^[\\w\\s]+$');
};

export const removeBadWords = (value: string): string => {
  const badwords = new BadWords();
  badwords.addWords('pedo', 'pedophile');
  if (isAlphaNumericSpace(value)) {
    return badwords.clean(value);
  }
  return value;
};

export const removeSpam = (value: string): string => {
  const censorify = new Censorify();
  const exceptions = [(match: any) => match.url === 'https://minaprotocol.com'];
  censorify.set({exceptions});
  return censorify.process(value);
};

export const sanitizeString = (value: string): string => {
  if (value && value.trim().length > 0) {
    value = removeSpam(value);
    value = removeBadWords(value);
  }

  if (value && isBad(value)) {
    return 'unavailable';
  }

  return value;
};

export const trimMiddle = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) {
    return str;
  }

  const leftHalfLength = Math.floor((maxLength - 3) / 2);
  const rightHalfLength = Math.ceil((maxLength - 3) / 2);

  const leftHalf = str.slice(0, leftHalfLength);
  const rightHalf = str.slice(-rightHalfLength);

  return `${leftHalf}...${rightHalf}`;
};

export const openLinkOnBrowser = (url: string) =>
  window.open(url, '_blank', 'top=500,left=200,frame=false,nodeIntegration=no');

export const spellMnemonic = (mnemonic: string) => {
  const wrongWords = [];
  for (const word of mnemonic.split(' ')) {
    if (!wordlists.EN.includes(word)) {
      wrongWords.push(word);
    }
  }
  return wrongWords;
};

export function decodeMemo(encode) {
  try {
    const encoded = bs58check.decode(encode);
    const res = encoded.slice(3, 3 + encoded[2]).toString('utf-8');
    return res;
  } catch (error) {
    return encode;
  }
}
async function getSignClient() {
  const netConfig = getCurrentNetConfig();
  const {default: Client} = await import('mina-signer');
  const client = new Client({
    network:
      JSON.parse(localStorage.getItem('networkSettings') ?? 'null')?.network ||
      netConfig.netType ||
      import.meta.env.VITE_REACT_APP_NETWORK,
  });
  return client;
}

/** build payment and delegation tx body */
function buildSignTxBody(params) {
  // const sendAction = params.sendAction;
  const sendFee = +params.fee || 0.1;
  const sendAmount = +params.amount || 0.1;
  const signBody = {
    to: params.to || params.receiverAddress,
    from: params.from || params.senderAddress,
    fee: sendFee,
    nonce: params.nonce || 0,
    memo: params.memo || '',
    amount: sendAmount,
  };
  // if (sendAction === DAppActions.mina_sendPayment) {
  //   const sendAmount = new Big(params.amount).mul(decimal).toFixed();
  //   signBody.amount = sendAmount;
  // }
  return signBody;
}

/** QA net sign */
export async function signTransaction(privateKey: string, params: unknown) {
  let signResult;
  try {
    const signClient = await getSignClient();
    let signBody = {};

    // if (params.sendAction === DAppActions.mina_signMessage) {
    //   signBody = params.message;
    // } else if (params.sendAction === DAppActions.mina_sendTransaction) {
    //   const decimal = new Big(10).pow(MAIN_COIN_CONFIG.decimals);
    //   const sendFee = new Big(params.fee).multipliedBy(decimal).toNumber();
    //   signBody = {
    //     zkappCommand: JSON.parse(params.transaction),
    //     feePayer: {
    //       feePayer: params.fromAddress,
    //       fee: sendFee,
    //       nonce: params.nonce,
    //       memo: params.memo || '',
    //     },
    //   };
    // } else {
    signBody = buildSignTxBody(params);
    // }
    signResult = signClient.signTransaction(signBody, privateKey);
    return signResult;
  } catch (err) {
    console.log('🚀 ~ signTransaction ~ err:', err);
  }
  return signResult;
}
