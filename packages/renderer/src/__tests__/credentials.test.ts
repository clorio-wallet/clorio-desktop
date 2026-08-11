import {beforeEach, describe, expect, it} from 'vitest';
import {
  decryptCredential,
  listCredentialRecords,
  storePrivateCredential,
  validateCredentialPayload,
} from '../tools/credentials';

const account = 'B62qcredentialowner';
const credential = {
  version: 'v0',
  witness: {issuer: 'test'},
  credential: {
    owner: {value: account},
    data: {age: 21},
  },
};

beforeEach(() => localStorage.clear());

describe('Mina credential storage', () => {
  it('encrypts a credential at rest and decrypts it with the wallet secret', async () => {
    const result = await storePrivateCredential({
      credential,
      accountPublicKey: account,
      sourceOrigin: 'https://credentials.example/path',
      walletSecret: 'wallet secret',
    });

    expect(JSON.parse(result.credential)).toEqual(credential);
    expect(localStorage.getItem('clorio:mina-credentials:v1')).not.toContain('"age":21');

    const [record] = listCredentialRecords(account);
    expect(record.sourceOrigin).toBe('https://credentials.example');
    await expect(decryptCredential(record, 'wallet secret')).resolves.toEqual(credential);
  });

  it('fails closed with the wrong wallet secret', async () => {
    await storePrivateCredential({
      credential,
      accountPublicKey: account,
      sourceOrigin: 'https://credentials.example',
      walletSecret: 'wallet secret',
    });

    const [record] = listCredentialRecords(account);
    await expect(decryptCredential(record, 'wrong secret')).rejects.toThrow();
  });

  it('rejects a credential owned by another account', () => {
    expect(() => validateCredentialPayload(credential, 'B62qother')).toThrow(
      'Credential owner does not match the active account.',
    );
  });

  it('rejects oversized credentials', () => {
    expect(() => validateCredentialPayload({data: 'x'.repeat(256 * 1024)})).toThrow(
      'Credential payload is too large.',
    );
  });
});
