import {BIP32Factory} from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import * as bs58check from 'bs58check';
export const MINA_COIN_INDEX = 12586;

const bip32 = BIP32Factory(ecc);

const generateKeypair = () => {
  return bip39.generateMnemonic();
};

const fromSeed = (seed: Buffer) => {
  return bip32.fromSeed(seed);
};

const mnemonicToSeed = async (mnemonic: string) => {
  const seed = await bip39.mnemonicToSeedSync(mnemonic);
  if (Buffer.isBuffer(seed)) {
    return bip32.fromSeed(seed);
  } else {
    return bip32.fromSeed(Buffer.from(seed));
  }
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
  const hdpath =
    'm/' + purpse + "'/" + MINA_COIN_INDEX + "'/" + account + "'/" + charge + '/' + index;
  return hdpath;
};

const reverseBytes = (bytes: any) => {
  const uint8 = new Uint8Array(bytes);
  const reversedBytes = Buffer.from(uint8.reverse());
  return reversedBytes;
};

const mnemonicToPrivateKey = async (mnemonic: string, accountNumber: number) => {
  const seed = await bip39.mnemonicToSeedSync(mnemonic);
  if (Buffer.isBuffer(seed)) {
    const masterNode = bip32.fromSeed(seed);
    const hdPath = getHDpath(accountNumber);
    const child0 = masterNode.derivePath(hdPath);
    if (child0?.privateKey) {
      child0.privateKey[0] &= 0x3f;
      const childPrivateKey = reverseBytes(child0.privateKey);
      const privateKeyHex = `5a01${childPrivateKey.toString('hex')}`;
      const privateKey = bs58check.encode(Buffer.from(privateKeyHex, 'hex'));
      return privateKey;
    }
  } else {
    const masterNode = bip32.fromSeed(Buffer.from(seed));
    const hdPath = getHDpath(accountNumber);
    const child0 = masterNode.derivePath(hdPath);
    if (child0?.privateKey) {
      child0.privateKey[0] &= 0x3f;
      const childPrivateKey = reverseBytes(child0.privateKey);
      const privateKeyHex = `5a01${childPrivateKey.toString('hex')}`;
      const privateKey = bs58check.encode(Buffer.from(privateKeyHex, 'hex'));
      return privateKey;
    }
  }
};

export {bip32, bip39, generateKeypair, ecc, fromSeed, mnemonicToSeed, mnemonicToPrivateKey};
