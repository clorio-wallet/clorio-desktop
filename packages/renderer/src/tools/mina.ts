import Big from 'big.js';
import * as bip39 from 'bip39';
import {mnemonicToPrivateKey} from '#preload';
// @ts-ignore
import * as bs58check from 'bs58check';
// @ts-ignore
import {MINA_COIN_INDEX} from './const';
import Client from 'mina-signer';
import {isElectron} from './environment';

export const client = async () => {
  const network =
    JSON.parse(localStorage.getItem('networkSettings'))?.network ||
    import.meta.env.VITE_REACT_APP_NETWORK ||
    'mainnet';
  const clientToReturn = new Client({
    network,
  });
  return clientToReturn;
};

export const toNanoMINA = (amount: number | string) => {
  return +Big(amount).mul(1e9).toFixed();
};

export const toMINA = (amount: number | string) => {
  return +Big(amount).mul(1e-9).toFixed(3);
};

export const toLongMINA = (amount: number | string) => {
  return Big(amount).mul(1e-9).toFixed();
};

/**
 * Determine if the input value is a passphrase or a private key.
 * Then derive the wallet data with the corresponding method.
 * @param value Private key or Passphrase
 * @returns Keypair
 */
export const deriveAccount = async (value: string, accountId?: number, skipChecks?: boolean) => {
  if (value.trim().split(' ').length > 2) {
    const derivedAccount = await deriveAccountFromMnemonic(value, accountId, skipChecks);
    return {
      publicKey: derivedAccount?.pubKey,
      privateKey: derivedAccount?.priKey,
    };
  }
  const client = await new Client({
    network:
      JSON.parse(localStorage.getItem('networkSettings'))?.network ||
      import.meta.env.VITE_REACT_APP_NETWORK,
  });
  const publicKey = client.derivePublicKey(value);
  return {
    publicKey,
    privateKey: value,
  };
};

/**
 * Check if the input mnemonic has enough words, then validate it through bip39.
 * @param mnemonic mnemonic passphrase
 * @returns Keypair
 */
export const deriveAccountFromMnemonic = async (
  mnemonic: string,
  accountId?: number,
  skipChecks?: boolean,
) => {
  const mneList = mnemonic.trim().split(' ');
  if (!skipChecks) {
    if (!(mneList.length === 12 || mneList.length === 24)) {
      throw new Error('Passphrase should be 12 or 24 words long');
    }
    const validMnemonic = bip39.validateMnemonic(mnemonic.trim());
    if (!validMnemonic && mneList.length !== 24) {
      throw new Error('Invalid passphrase');
    }
  }
  const wallet = await deriveWalletByMnemonic(mnemonic, accountId);
  return wallet;
};

/**
 * Hierarchical Deterministic path
 * @param account Account number
 * @returns HD path
 */
export const getHDpath = (account = 0) => {
  const purpse = 44;
  const index = 0;
  const charge = 0;
  const hdpath = `m/${purpse}'/${MINA_COIN_INDEX}'/${account}'/${charge}/${index}`;
  return hdpath;
};

const reverseBytes = (bytes: any) => {
  const uint8 = new Uint8Array(bytes);
  const reversedBytes = Buffer.from(uint8.reverse());
  return reversedBytes;
};

/**
 * Derive the wallet keypair through the mnemonic passphrase
 * @param mnemonic passphrase
 * @param accountNumber
 * @returns Keypair
 */
export const deriveWalletByMnemonic = async (mnemonic: string, accountNumber = 0) => {
  let privateKey;
  if (!isElectron()) {
    const {BIP32Factory} = await import('bip32');
    const ecc = await import('tiny-secp256k1');
    const bip32 = BIP32Factory(ecc);

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const masterNode = bip32.fromSeed(seed);
    const hdPath = getHDpath(accountNumber);
    const child0 = masterNode.derivePath(hdPath);
    if (child0?.privateKey) {
      child0.privateKey[0] &= 0x3f;
      const childPrivateKey = reverseBytes(child0.privateKey);
      const privateKeyHex = `5a01${childPrivateKey.toString('hex')}`;
      privateKey = bs58check.encode(Buffer.from(privateKeyHex, 'hex'));
    }
  } else {
    privateKey = await mnemonicToPrivateKey(mnemonic, accountNumber);
  }
  if (privateKey) {
    const client = await new Client({
      network:
        JSON.parse(localStorage.getItem('networkSettings'))?.network ||
        import.meta.env.VITE_REACT_APP_NETWORK ||
        'mainnet',
    });
    const publicKey = client.derivePublicKey(privateKey);
    return {
      priKey: privateKey,
      pubKey: publicKey,
      hdIndex: accountNumber,
    };
  }
};
