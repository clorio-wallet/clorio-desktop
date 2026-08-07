import {
  decryptCredential,
  EncryptedCredentialRecord,
  listCredentialRecords,
} from './credentials';
import {client} from './mina';

/** Returns credentials belonging to the account and requesting zkApp origin. */
export const findMatchingCredentialRecords = (
  accountPublicKey: string,
  origin: string,
): EncryptedCredentialRecord[] => {
  const originToMatch = new URL(origin).origin;
  return listCredentialRecords(accountPublicKey).filter(
    record => record.sourceOrigin === originToMatch,
  );
};

/** Generates a proof in an Electron utility process without sharing the key. */
export const requestPresentation = async ({
  presentationRequest,
  origin,
  accountPublicKey,
  walletSecret,
  privateKey,
  onProgress,
}: {
  presentationRequest: unknown;
  origin: string;
  accountPublicKey: string;
  walletSecret: string;
  privateKey: string;
  onProgress?: (status: string) => void;
}): Promise<{presentation: string}> => {
  const records = listCredentialRecords(accountPublicKey);
  if (records.length === 0) {
    throw new Error('No stored credential was found for this account.');
  }

  const matchingRecords = findMatchingCredentialRecords(accountPublicKey, origin);
  if (matchingRecords.length === 0) {
    throw new Error('No stored credential was found for this site.');
  }

  onProgress?.('Decrypting your credential…');
  const credentials = await Promise.all(
    matchingRecords.map(record => decryptCredential(record, walletSecret)),
  );
  const id = crypto.randomUUID();
  try {
    onProgress?.('Generating the zero-knowledge proof…');
    const prepared = JSON.parse(
      (await window.ipcBridge.invoke(
        'presentation-prepare',
        JSON.stringify({
          id,
          presentationRequest,
          credentials,
          origin: new URL(origin).origin,
        }),
      )) as string,
    ) as {id: string; messageFields: string[]};
    onProgress?.('Signing the presentation…');
    const signed = await (await client()).signFields(
      prepared.messageFields.map(BigInt),
      privateKey,
    );
    onProgress?.('Finalizing the presentation…');
    return JSON.parse(
      (await window.ipcBridge.invoke(
        'presentation-finalize',
        JSON.stringify({id, signature: signed.signature}),
      )) as string,
    ) as {presentation: string};
  } catch (error) {
    await window.ipcBridge.invoke('presentation-abort', id).catch(() => undefined);
    throw error;
  }
};
