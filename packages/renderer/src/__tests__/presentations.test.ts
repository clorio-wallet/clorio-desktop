import {beforeEach, describe, expect, it} from 'vitest';
import {storePrivateCredential} from '../tools/credentials';
import {findMatchingCredentialRecords} from '../tools/presentations';

const account = 'B62qpresentationowner';
const credential = {
  version: 'v0',
  witness: {issuer: 'test'},
  credential: {
    owner: {value: account},
    data: {age: 21},
  },
};

const credentialFor = (owner: string) => ({
  ...credential,
  credential: {owner: {value: owner}, data: {age: 21}},
});

beforeEach(() => localStorage.clear());

describe('Mina credential presentation matching', () => {
  it('returns credentials stored for the account and the requesting origin', async () => {
    await storePrivateCredential({
      credential,
      accountPublicKey: account,
      sourceOrigin: 'https://zkapp.example/path',
      walletSecret: 'secret',
    });

    const matches = findMatchingCredentialRecords(account, 'https://zkapp.example/');
    expect(matches).toHaveLength(1);
    expect(matches[0].sourceOrigin).toBe('https://zkapp.example');
  });

  it('does not return credentials from a different origin', async () => {
    await storePrivateCredential({
      credential,
      accountPublicKey: account,
      sourceOrigin: 'https://other.example',
      walletSecret: 'secret',
    });

    const matches = findMatchingCredentialRecords(account, 'https://zkapp.example/');
    expect(matches).toHaveLength(0);
  });

  it('does not return credentials stored for another account', async () => {
    const other = 'B62qother';
    await storePrivateCredential({
      credential: credentialFor(other),
      accountPublicKey: other,
      sourceOrigin: 'https://zkapp.example',
      walletSecret: 'secret',
    });

    const matches = findMatchingCredentialRecords(account, 'https://zkapp.example/');
    expect(matches).toHaveLength(0);
  });
});
