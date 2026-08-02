type PrepareMessage = {
  type: 'prepare';
  id: string;
  presentationRequest: unknown;
  credentials: unknown[];
  origin: string;
};

type FinalizeMessage = {type: 'finalize'; id: string; signature: string};

type PreparedJob = {request: any; prepared: any};
const jobs = new Map<string, PreparedJob>();
const parentPort = process.parentPort;

if (!parentPort) {
  throw new Error('Presentation service requires an Electron parent port.');
}

const fail = (id: string, error: unknown) => {
  jobs.delete(id);
  parentPort.postMessage({
    type: 'failed',
    id,
    message: error instanceof Error ? error.message : String(error),
  });
};

parentPort.on('message', async event => {
  const message = event.data as PrepareMessage | FinalizeMessage;
  try {
    const [{Credential, Presentation, PresentationRequest}, {Signature}] =
      await Promise.all([import('mina-attestations'), import('o1js')]);

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
      parentPort.postMessage({
        type: 'prepared',
        id: message.id,
        messageFields: prepared.messageFields.map(field => field.toString()),
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
    parentPort.postMessage({
      type: 'completed',
      id: message.id,
      presentation: Presentation.toJSON(presentation),
    });
  } catch (error) {
    fail(message.id, error);
  }
});
