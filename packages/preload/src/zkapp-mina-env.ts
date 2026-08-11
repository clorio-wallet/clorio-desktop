import {ipcRenderer} from 'electron';

const allowedRequestChannels: string[] = [
  'get-network-config',
  'get-address',
  'sign-tx',
  'sign-message',
  'get-accounts',
  'send-payment',
  'add-chain',
  'switch-chain',
  'verify-message',
  'sign-json-message',
  'verify-json-message',
  'create-nullifier',
  'stake-delegation',
  'sign-fields',
  'verify-fields',
  'store-private-credential',
  'request-presentation',
  'focus-clorio',
];

const allowedResponseChannels = [
  'set-network-config',
  'set-address',
  'signed-tx',
  'signed-message',
  'set-accounts',
  'signed-payment',
  'added-chain',
  'switched-chain',
  'error',
  'verified-message',
  'signed-json-message',
  'verified-json-message',
  'created-nullifier',
  'staked-delegation',
  'signed-fields',
  'verified-fields',
  'stored-private-credential',
  'presentation-created',
  'focus-clorio',
];

interface AddChainArgs {
  url: string;
  name: string;
}

const sendIpcRequest = (requestChannel: string, responseChannel: string, data?: any) => {
  return new Promise((resolve, reject) => {
    if (
      !allowedRequestChannels.includes(requestChannel) ||
      !allowedResponseChannels.includes(responseChannel)
    ) {
      reject(new Error('Invalid channel names'));
      return;
    }

    const onResponse = (_event: Electron.IpcRendererEvent, responseData: string) => {
      ipcRenderer.removeListener('error', onError);
      try {
        resolve(JSON.parse(responseData));
      } catch {
        reject(new Error('Invalid response data'));
      }
    };
    const onError = (_event: Electron.IpcRendererEvent, error: unknown) => {
      ipcRenderer.removeListener(responseChannel, onResponse);
      const providerError = typeof error === 'string' ? JSON.parse(error) : error;
      console.error(`[Clorio] ${requestChannel} failed:`, providerError);
      reject(providerError);
    };

    ipcRenderer.once(responseChannel, onResponse);
    ipcRenderer.once('error', onError);
    ipcRenderer.send(requestChannel, data);
  });
};

const providerListeners = new Map<
  string,
  Map<(data: unknown) => void, (_: Electron.IpcRendererEvent, data: unknown) => void>
>();

const zkappIntegration = {
  isAuro: true,
  isClorio: true,
  on: (channel: string, resp: (data: unknown) => void) => {
    console.log('channel', channel);
    let listener: ((_: Electron.IpcRendererEvent, data: unknown) => void) | undefined;
    switch (channel) {
      case 'accountsChanged':
        listener = (_, responseData) => resp([responseData]);
        break;
      case 'chainChanged':
        listener = (_, responseData) => resp(JSON.parse(String(responseData)));
        break;
    }

    if (listener) {
      const listeners = providerListeners.get(channel) ?? new Map();
      listeners.set(resp, listener);
      providerListeners.set(channel, listeners);
      ipcRenderer.on(channel, listener);
    }
  },
  removeListener: (channel: string, resp: (data: unknown) => void) => {
    const listeners = providerListeners.get(channel);
    const listener = listeners?.get(resp);
    if (!listener) return;
    ipcRenderer.removeListener(channel, listener);
    listeners?.delete(resp);
    if (listeners?.size === 0) providerListeners.delete(channel);
  },
  requestNetwork: () => sendIpcRequest('get-network-config', 'set-network-config', null),
  addChain: (data: AddChainArgs) => sendIpcRequest('add-chain', 'added-chain', data),
  switchChain: ({networkID, chainId}: {networkID: string; chainId: string}) =>
    sendIpcRequest('switch-chain', 'switched-chain', networkID || chainId),
  getAccounts: () => sendIpcRequest('get-accounts', 'set-accounts'),
  requestAccounts: () => sendIpcRequest('get-address', 'set-address'),
  sendTransaction: (data: any) => sendIpcRequest('sign-tx', 'signed-tx', data),
  signMessage: (data: any) => sendIpcRequest('sign-message', 'signed-message', data),
  sendPayment: (data: any) => sendIpcRequest('send-payment', 'signed-payment', data),
  verifyMessage: (data: any) => sendIpcRequest('verify-message', 'verified-message', data),
  signJsonMessage: (data: any) => sendIpcRequest('sign-json-message', 'signed-json-message', data),
  verifyJsonMessage: (data: any) =>
    sendIpcRequest('verify-json-message', 'verified-json-message', data),
  createNullifier: (data: any) => sendIpcRequest('create-nullifier', 'created-nullifier', data),
  sendStakeDelegation: (data: any) => sendIpcRequest('stake-delegation', 'staked-delegation', data),
  signFields: (data: any) => sendIpcRequest('sign-fields', 'signed-fields', data),
  verifyFields: (data: any) => sendIpcRequest('verify-fields', 'verified-fields', data),
  storePrivateCredential: (data: {credential: unknown}) =>
    sendIpcRequest('store-private-credential', 'stored-private-credential', data),
  requestPresentation: (data: {presentation: unknown}) =>
    sendIpcRequest('request-presentation', 'presentation-created', data),
  focusClorio: () => sendIpcRequest('focus-clorio', 'focus-clorio'),
};

export default zkappIntegration;
