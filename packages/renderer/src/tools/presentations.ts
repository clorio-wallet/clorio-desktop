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

/**
 * Generates a presentation in an isolated worker. The worker prepares the
 * proof and returns only fields to sign. The private key remains in the trusted
 * renderer, which returns only the resulting signature for finalization.
 */
export const requestPresentation = async ({
  presentationRequest,
  origin,
  accountPublicKey,
  privateKey,
}: {
  presentationRequest: unknown;
  origin: string;
  accountPublicKey: string;
  privateKey: string;
}): Promise<{presentation: string}> => {
  const records = listCredentialRecords(accountPublicKey);
  if (records.length === 0) {
    throw new Error('No stored credential was found for this account.');
  }

  const matchingRecords = findMatchingCredentialRecords(accountPublicKey, origin);
  if (matchingRecords.length === 0) {
    throw new Error('No stored credential was found for this site.');
  }

  const credentials = await Promise.all(
    matchingRecords.map(record => decryptCredential(record, privateKey)),
  );
  if (!window.crossOriginIsolated) {
    throw new Error('Clorio proof runner is not cross-origin isolated.');
  }

  const worker = new Worker(new URL('./presentation-worker.ts', import.meta.url), {
    type: 'module',
  });
  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error('Presentation generation timed out.'));
    }, 120_000);

    const finish = () => {
      window.clearTimeout(timeout);
      worker.terminate();
    };

    worker.onerror = event => {
      console.error('Presentation worker error event:', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        crossOriginIsolated: window.crossOriginIsolated,
      });
      finish();
      reject(
        event.error instanceof Error
          ? event.error
          : new Error(event.message || 'Presentation worker failed.'),
      );
    };

    worker.onmessage = async (
      event: MessageEvent<
        | {type: 'prepared'; id: string; messageFields: string[]}
        | {type: 'completed'; id: string; presentation: string}
        | {type: 'failed'; id: string; message: string; stack?: string}
      >,
    ) => {
      const message = event.data;
      if (message.id !== id) return;

      if (message.type === 'failed') {
        finish();
        const error = new Error(message.message);
        if (message.stack) error.stack = message.stack;
        reject(error);
        return;
      }

      if (message.type === 'prepared') {
        try {
          const signed = await (await client()).signFields(
            message.messageFields.map(BigInt),
            privateKey,
          );
          worker.postMessage({type: 'finalize', id, signature: signed.signature});
        } catch (error) {
          finish();
          reject(error);
        }
        return;
      }

      finish();
      resolve({presentation: message.presentation});
    };

    worker.postMessage({
      type: 'prepare',
      id,
      presentationRequest,
      credentials,
      origin: new URL(origin).origin,
    });
  });
};
