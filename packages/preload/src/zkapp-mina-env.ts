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
  'focus-clorio',
  'share-url',
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
  'focus-clorio',
  'share-url',
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

    ipcRenderer.send(requestChannel, data);

    ipcRenderer.once(responseChannel, (event, responseData) => {
      try {
        resolve(JSON.parse(responseData));
      } catch (error) {
        reject(new Error('Invalid response data'));
      }
    });

    ipcRenderer.once('error', (event, error) => {
      reject(JSON.parse(error));
    });
  });
};

const zkappIntegration = {
  on: (channel: string, resp: (data: unknown) => void) => {
    console.log('channel', channel);
    switch (channel) {
      case 'accountsChanged':
        ipcRenderer.on('accountsChanged', (_, responseData) => {
          resp([responseData]);
        });
        break;
      case 'chainChanged':
        ipcRenderer.on('chainChanged', (_, responseData) => {
          resp(JSON.parse(responseData));
        });
        break;
    }
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
  focusClorio: () => sendIpcRequest('focus-clorio', 'focus-clorio'),
  shareUrl: (url: string) => sendIpcRequest('share-url', 'share-url', url),
};

export default zkappIntegration;
