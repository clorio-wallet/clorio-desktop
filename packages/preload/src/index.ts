/**
 * @module preload
 *
 * Security note: all IPC channels exposed to the renderer are explicitly allowlisted.
 * Any call with a channel name not in the list is silently rejected.
 */
import {contextBridge, ipcRenderer} from 'electron';
// @ts-ignore
import appendQuery from 'append-query';
import type {Query} from 'append-query';

window.__dirname = __dirname;

export {
  bip32,
  bip39,
  generateKeypair,
  ecc,
  fromSeed,
  mnemonicToSeed,
  mnemonicToPrivateKey,
} from './bip';

import zkappIntegration from './zkapp-mina-env';

// ---------------------------------------------------------------------------
// Channel allowlists
// Only channels listed here can be used from the renderer process.
// ---------------------------------------------------------------------------

/** Channels the renderer may invoke (request/response via ipcRenderer.invoke) */
const ALLOWED_INVOKE_CHANNELS: ReadonlySet<string> = new Set([
  'ledger-get-name-version',
  'ledger-get-address',
  'ledger-sign-transaction',
  'open-win',
]);

/** Channels the renderer may send one-way messages on */
const ALLOWED_SEND_CHANNELS: ReadonlySet<string> = new Set([
  'CHECK_FOR_UPDATE_PENDING',
  'account-change',
  'chain-change',
  // Explicit responses from the trusted wallet renderer to a zkApp child window.
  'clorio-set-network-config',
  'clorio-set-address',
  'clorio-set-accounts',
  'clorio-signed-tx',
  'clorio-signed-message',
  'clorio-signed-payment',
  'clorio-added-chain',
  'clorio-switched-chain',
  'clorio-verified-message',
  'clorio-signed-json-message',
  'clorio-verified-json-message',
  'clorio-created-nullifier',
  'clorio-staked-delegation',
  'clorio-signed-fields',
  'clorio-verified-fields',
  'clorio-stored-private-credential',
  'clorio-presentation-created',
  'clorio-error',
  'focus-clorio',
]);

/** Channels the renderer may subscribe to with .on() */
const ALLOWED_ON_CHANNELS: ReadonlySet<string> = new Set([
  'CHECK_FOR_UPDATE_SUCCESS',
  'UPDATE_ERROR',
  'DOWNLOAD_UPDATE_SUCCESS',
  'DOWNLOAD_UPDATE_FAILURE',
  'deeplink',
  'clorio-event',
  // zkapp response channels forwarded from the child window
  'clorio-set-network-config',
  'clorio-set-address',
  'clorio-set-accounts',
  'clorio-signed-tx',
  'clorio-signed-message',
  'clorio-signed-payment',
  'clorio-added-chain',
  'clorio-switched-chain',
  'clorio-verified-message',
  'clorio-signed-json-message',
  'clorio-verified-json-message',
  'clorio-created-nullifier',
  'clorio-staked-delegation',
  'clorio-signed-fields',
  'clorio-verified-fields',
  'clorio-presentation-created',
  'error',
]);

/** Channels the renderer may unsubscribe from with .off() */
const ALLOWED_OFF_CHANNELS: ReadonlySet<string> = new Set([...ALLOWED_ON_CHANNELS]);

/** Channels the renderer may remove all listeners from */
const ALLOWED_REMOVE_ALL_CHANNELS: ReadonlySet<string> = new Set([...ALLOWED_ON_CHANNELS]);

// ---------------------------------------------------------------------------
// deeplink bridge
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('deeplink', {
  onDeeplink: (callback: (url: string) => void) => {
    ipcRenderer.on('deeplink', (_event, url: string) => {
      callback(url);
    });
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    if (ALLOWED_OFF_CHANNELS.has(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});

// ---------------------------------------------------------------------------
// ipcBridge — guarded IPC surface exposed to the renderer
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('ipcBridge', {
  invoke: (channel: string, data?: unknown): Promise<unknown> => {
    if (!ALLOWED_INVOKE_CHANNELS.has(channel)) {
      return Promise.reject(new Error(`ipcBridge.invoke: channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, data);
  },

  send: (channel: string, data?: unknown): void => {
    if (!ALLOWED_SEND_CHANNELS.has(channel)) {
      console.warn(`ipcBridge.send: channel "${channel}" is not allowed`);
      return;
    }
    ipcRenderer.send(channel, data);
  },

  on: (channel: string, callback: (event: unknown, ...args: unknown[]) => void): void => {
    if (!ALLOWED_ON_CHANNELS.has(channel)) {
      console.warn(`ipcBridge.on: channel "${channel}" is not allowed`);
      return;
    }
    // Remove any previously registered listener for this channel to prevent duplicates
    if (ipcRenderer.listenerCount(channel) > 0) {
      ipcRenderer.removeAllListeners(channel);
    }
    ipcRenderer.on(channel, callback);
  },

  off: (channel: string, callback: (event: unknown, ...args: unknown[]) => void): void => {
    if (!ALLOWED_OFF_CHANNELS.has(channel)) {
      return;
    }
    ipcRenderer.off(channel, callback);
  },

  removeAllListeners: (channel: string): void => {
    if (!ALLOWED_REMOVE_ALL_CHANNELS.has(channel)) {
      console.warn(`ipcBridge.removeAllListeners: channel "${channel}" is not allowed`);
      return;
    }
    ipcRenderer.removeAllListeners(channel);
  },

  listenerCount: (channel: string): number => {
    return ipcRenderer.listenerCount(channel);
  },
});

// ---------------------------------------------------------------------------
// Mina / ZkApp bridge
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('mina', zkappIntegration);

// ---------------------------------------------------------------------------
// URL utility
// ---------------------------------------------------------------------------

const appendQueryParams = (url: string, params: string | Query): string => {
  return appendQuery(url, params);
};

export {appendQueryParams};
