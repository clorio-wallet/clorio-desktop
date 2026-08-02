import {utilityProcess, UtilityProcess} from 'electron';

const MAX_PAYLOAD_BYTES = 1024 * 1024;
const OPERATION_TIMEOUT_MS = 180_000;

type ServiceResponse =
  | {type: 'prepared'; id: string; messageFields: string[]}
  | {type: 'completed'; id: string; presentation: string}
  | {type: 'failed'; id: string; message: string};

interface ActiveJob {
  process: UtilityProcess;
  idleTimeout: NodeJS.Timeout;
}

const serializedSize = (value: unknown) =>
  Buffer.byteLength(JSON.stringify(value), 'utf8');

export class PresentationService {
  private readonly jobs = new Map<string, ActiveJob>();

  constructor(private readonly processPath: string) {}

  async prepare(input: {
    id: string;
    presentationRequest: unknown;
    credentials: unknown[];
    origin: string;
  }): Promise<{id: string; messageFields: string[]}> {
    if (this.jobs.size > 0) throw new Error('A presentation is already pending.');
    if (!input.id || !Array.isArray(input.credentials) || input.credentials.length === 0) {
      throw new Error('Invalid presentation preparation payload.');
    }
    const origin = new URL(input.origin);
    if (!['http:', 'https:'].includes(origin.protocol)) {
      throw new Error('Unsupported presentation origin.');
    }
    if (serializedSize(input) > MAX_PAYLOAD_BYTES) {
      throw new Error('Presentation payload is too large.');
    }

    const child = utilityProcess.fork(this.processPath, [], {
      serviceName: 'Clorio Presentation Service',
      stdio: 'pipe',
    });
    child.stderr?.on('data', data =>
      console.error(`[presentation-service] ${String(data).trim()}`),
    );
    const idleTimeout = setTimeout(() => this.stop(input.id), OPERATION_TIMEOUT_MS);
    this.jobs.set(input.id, {process: child, idleTimeout});

    try {
      await this.waitForSpawn(child);
      const response = await this.send(child, {
        type: 'prepare',
        ...input,
        origin: origin.origin,
      }, 'prepared');
      return {id: response.id, messageFields: response.messageFields as string[]};
    } catch (error) {
      this.stop(input.id);
      throw error;
    }
  }

  async finalize(input: {id: string; signature: string}): Promise<{presentation: string}> {
    const job = this.jobs.get(input.id);
    if (!job || !input.signature) throw new Error('Presentation preparation not found.');

    try {
      const response = await this.send(job.process, {
        type: 'finalize',
        ...input,
      }, 'completed');
      return {presentation: response.presentation as string};
    } finally {
      this.stop(input.id);
    }
  }

  abort(id: string): void {
    this.stop(id);
  }

  dispose(): void {
    [...this.jobs.keys()].forEach(id => this.stop(id));
  }

  private waitForSpawn(child: UtilityProcess): Promise<void> {
    if (child.pid) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onSpawn = () => {
        child.removeListener('exit', onExit);
        resolve();
      };
      const onExit = (code: number) => {
        child.removeListener('spawn', onSpawn);
        reject(new Error(`Presentation service exited before spawn (${code}).`));
      };
      child.once('spawn', onSpawn);
      child.once('exit', onExit);
    });
  }

  private send(
    child: UtilityProcess,
    message: Record<string, unknown>,
    expectedType: 'prepared' | 'completed',
  ): Promise<ServiceResponse & Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Presentation service timed out.'));
      }, OPERATION_TIMEOUT_MS);
      const onMessage = (response: ServiceResponse) => {
        if (response.id !== message.id) return;
        cleanup();
        if (response.type === 'failed') reject(new Error(response.message));
        else if (response.type === expectedType) resolve(response);
        else reject(new Error('Unexpected presentation service response.'));
      };
      const onExit = (code: number) => {
        cleanup();
        reject(new Error(`Presentation service exited (${code}).`));
      };
      const cleanup = () => {
        clearTimeout(timeout);
        child.removeListener('message', onMessage);
        child.removeListener('exit', onExit);
      };
      child.on('message', onMessage);
      child.once('exit', onExit);
      child.postMessage(message);
    });
  }

  private stop(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    this.jobs.delete(id);
    clearTimeout(job.idleTimeout);
    job.process.kill();
  }
}
