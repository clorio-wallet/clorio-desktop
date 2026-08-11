import {Credential, Presentation, PresentationRequest} from 'mina-attestations';
import {Signature} from 'o1js';

type WorkerRequest =
  | {
      type: 'prepare';
      id: string;
      presentationRequest: unknown;
      credentials: unknown[];
      origin: string;
    }
  | {type: 'finalize'; id: string; signature: string};

type PreparedJob = {
  request: Parameters<typeof Presentation.finalize>[0];
  prepared: Awaited<ReturnType<typeof Presentation.prepare>>;
};

const jobs = new Map<string, PreparedJob>();

const fail = (id: string, error: unknown) => {
  jobs.delete(id);
  self.postMessage({
    type: 'failed',
    id,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  try {
    if (message.type === 'prepare') {
      const requestType =
        typeof (message.presentationRequest as {type?: unknown})?.type === 'string'
          ? (message.presentationRequest as {
              type: 'https' | 'zk-app' | 'no-context';
            }).type
          : 'https';
      const request = PresentationRequest.fromJSON(
        requestType,
        JSON.stringify(message.presentationRequest),
      );
      const credentials = await Promise.all(
        message.credentials.map(credential =>
          Credential.fromJSON(JSON.stringify(credential)),
        ),
      );
      const prepared = await Presentation.prepare({
        request,
        credentials,
        context: {verifierIdentity: message.origin},
      });
      jobs.set(message.id, {request, prepared});
      self.postMessage({
        type: 'prepared',
        id: message.id,
        messageFields: prepared.messageFields,
        crossOriginIsolated: self.crossOriginIsolated,
      });
      return;
    }

    const job = jobs.get(message.id);
    if (!job) throw new Error('Presentation preparation expired.');
    const presentation = await Presentation.finalize(
      job.request,
      Signature.fromBase58(message.signature),
      job.prepared,
    );
    jobs.delete(message.id);
    self.postMessage({
      type: 'completed',
      id: message.id,
      presentation: Presentation.toJSON(presentation),
    });
  } catch (error) {
    fail(message.id, error);
  }
};
