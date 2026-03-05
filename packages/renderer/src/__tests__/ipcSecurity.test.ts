/**
 * Unit tests for IPC channel allowlist security (B3 fix regression guard)
 *
 * These tests verify that:
 * 1. The preload's allowlists contain every channel the renderer actually uses
 * 2. No sensitive/unexpected channels are accidentally exposed
 * 3. The allowlists are non-empty and structurally correct
 * 4. Channel naming conventions are consistent
 *
 * NOTE: We cannot import the preload module directly (it depends on Electron's
 * contextBridge which is not available in vitest). Instead, we test the
 * allowlist logic by mirroring the sets here and verifying invariants.
 * If the preload changes, the mirrored sets below must be updated too —
 * that friction is intentional: it forces a conscious review of any change.
 *
 * Run with:  pnpm vitest run -r packages/renderer --reporter=verbose
 */

import {describe, it, expect} from 'vitest';

// ---------------------------------------------------------------------------
// Mirror the allowlists from packages/preload/src/index.ts
// These MUST be kept in sync with the actual preload.
// If a test fails after you add a channel to the preload, add it here too.
// ---------------------------------------------------------------------------

const ALLOWED_INVOKE_CHANNELS = new Set([
  'ledger-get-name-version',
  'ledger-get-address',
  'ledger-sign-transaction',
  'open-win',
]);

const ALLOWED_SEND_CHANNELS = new Set([
  'CHECK_FOR_UPDATE_PENDING',
  'account-change',
  'chain-change',
]);

const ALLOWED_ON_CHANNELS = new Set([
  'CHECK_FOR_UPDATE_SUCCESS',
  'UPDATE_ERROR',
  'DOWNLOAD_UPDATE_SUCCESS',
  'DOWNLOAD_UPDATE_FAILURE',
  'deeplink',
  'clorio-event',
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
  'error',
]);

// Channels the renderer actually sends (gathered from grep of ipcBridge.send calls)
const RENDERER_SEND_USAGES = [
  'CHECK_FOR_UPDATE_PENDING', // tools/utils.ts — electronAlerts
  'account-change',           // main process forwards this — used in chain-change flow
  'chain-change',             // main process forwards this
] as const;

// Channels the renderer actually subscribes to (gathered from grep of ipcBridge.on calls)
const RENDERER_ON_USAGES = [
  'CHECK_FOR_UPDATE_SUCCESS',    // tools/utils.ts — electronAlerts
  'UPDATE_ERROR',                // tools/utils.ts — electronAlerts
  'DOWNLOAD_UPDATE_SUCCESS',     // tools/utils.ts — electronAlerts
  'DOWNLOAD_UPDATE_FAILURE',     // tools/utils.ts — electronAlerts
  'clorio-event',                // components/ZkappIntegration.tsx
  'deeplink',                    // deeplink bridge (separate contextBridge entry)
] as const;

// Channels the renderer invokes (gathered from grep of ipcBridge.invoke calls)
const RENDERER_INVOKE_USAGES = [
  'ledger-get-name-version',   // tools/ledger/ledgerElectronAPI.ts
  'ledger-get-address',        // tools/ledger/ledgerElectronAPI.ts
  'ledger-sign-transaction',   // tools/ledger/ledgerElectronAPI.ts
  'open-win',                  // modals/zkAppIntegration — ZkappConnectedApps, ZkappIframe, ZkappSidebar
] as const;

// Channels that must NEVER appear in any allowlist (security-critical)
const FORBIDDEN_CHANNELS = [
  'shell-exec',
  'exec',
  'spawn',
  'node-exec',
  'fs-read',
  'fs-write',
  'eval',
  'require',
  '*',          // wildcard must never be a channel name
] as const;

// ---------------------------------------------------------------------------
// Structural integrity — allowlists are non-empty and contain strings
// ---------------------------------------------------------------------------
describe('allowlist structural integrity', () => {
  it('ALLOWED_INVOKE_CHANNELS is non-empty', () => {
    expect(ALLOWED_INVOKE_CHANNELS.size).toBeGreaterThan(0);
  });

  it('ALLOWED_SEND_CHANNELS is non-empty', () => {
    expect(ALLOWED_SEND_CHANNELS.size).toBeGreaterThan(0);
  });

  it('ALLOWED_ON_CHANNELS is non-empty', () => {
    expect(ALLOWED_ON_CHANNELS.size).toBeGreaterThan(0);
  });

  it('all INVOKE channels are non-empty strings', () => {
    for (const ch of ALLOWED_INVOKE_CHANNELS) {
      expect(typeof ch).toBe('string');
      expect(ch.trim().length).toBeGreaterThan(0);
    }
  });

  it('all SEND channels are non-empty strings', () => {
    for (const ch of ALLOWED_SEND_CHANNELS) {
      expect(typeof ch).toBe('string');
      expect(ch.trim().length).toBeGreaterThan(0);
    }
  });

  it('all ON channels are non-empty strings', () => {
    for (const ch of ALLOWED_ON_CHANNELS) {
      expect(typeof ch).toBe('string');
      expect(ch.trim().length).toBeGreaterThan(0);
    }
  });

  it('no channel name contains whitespace', () => {
    const all = [
      ...ALLOWED_INVOKE_CHANNELS,
      ...ALLOWED_SEND_CHANNELS,
      ...ALLOWED_ON_CHANNELS,
    ];
    for (const ch of all) {
      expect(ch).not.toMatch(/\s/);
    }
  });

  it('no channel name is a wildcard "*"', () => {
    const all = [
      ...ALLOWED_INVOKE_CHANNELS,
      ...ALLOWED_SEND_CHANNELS,
      ...ALLOWED_ON_CHANNELS,
    ];
    expect(all).not.toContain('*');
  });
});

// ---------------------------------------------------------------------------
// Security: forbidden channels must not appear in any allowlist
// ---------------------------------------------------------------------------
describe('security — forbidden channels are not allowed', () => {
  for (const forbidden of FORBIDDEN_CHANNELS) {
    it(`"${forbidden}" is not in ALLOWED_INVOKE_CHANNELS`, () => {
      expect(ALLOWED_INVOKE_CHANNELS.has(forbidden)).toBe(false);
    });

    it(`"${forbidden}" is not in ALLOWED_SEND_CHANNELS`, () => {
      expect(ALLOWED_SEND_CHANNELS.has(forbidden)).toBe(false);
    });

    it(`"${forbidden}" is not in ALLOWED_ON_CHANNELS`, () => {
      expect(ALLOWED_ON_CHANNELS.has(forbidden)).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// Security: ipcMain must not be accessible from the renderer
// (it is a main-process-only module — exposing it via contextBridge is a bug)
// ---------------------------------------------------------------------------
describe('security — ipcMain is not exposed', () => {
  it('ALLOWED_INVOKE_CHANNELS does not contain an ipcMain proxy channel', () => {
    // No channel should be named after ipcMain methods
    const ipcMainMethods = ['ipcMain', 'main-on', 'mainOn'];
    for (const m of ipcMainMethods) {
      expect(ALLOWED_INVOKE_CHANNELS.has(m)).toBe(false);
    }
  });

  it('no allowlist exposes raw ipcRenderer access', () => {
    const rawAccess = ['ipcRenderer', 'electron', 'electron-ipc'];
    const all = [
      ...ALLOWED_INVOKE_CHANNELS,
      ...ALLOWED_SEND_CHANNELS,
      ...ALLOWED_ON_CHANNELS,
    ];
    for (const raw of rawAccess) {
      expect(all).not.toContain(raw);
    }
  });
});

// ---------------------------------------------------------------------------
// Coverage: all renderer INVOKE usages are in the allowlist
// If this test fails, the renderer is trying to invoke a channel that would
// be blocked — add it to the preload allowlist and update ALLOWED_INVOKE_CHANNELS.
// ---------------------------------------------------------------------------
describe('coverage — all renderer invoke usages are allowlisted', () => {
  for (const channel of RENDERER_INVOKE_USAGES) {
    it(`invoke channel "${channel}" is in ALLOWED_INVOKE_CHANNELS`, () => {
      expect(ALLOWED_INVOKE_CHANNELS.has(channel)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Coverage: all renderer SEND usages are in the allowlist
// ---------------------------------------------------------------------------
describe('coverage — all renderer send usages are allowlisted', () => {
  for (const channel of RENDERER_SEND_USAGES) {
    it(`send channel "${channel}" is in ALLOWED_SEND_CHANNELS`, () => {
      expect(ALLOWED_SEND_CHANNELS.has(channel)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Coverage: all renderer ON usages are in the allowlist
// ---------------------------------------------------------------------------
describe('coverage — all renderer on usages are allowlisted', () => {
  for (const channel of RENDERER_ON_USAGES) {
    it(`on channel "${channel}" is in ALLOWED_ON_CHANNELS`, () => {
      expect(ALLOWED_ON_CHANNELS.has(channel)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// Allowlist guard logic simulation
// Verifies the guard behaviour that the preload implements:
//   - allowed channels pass through
//   - unknown channels are rejected
// ---------------------------------------------------------------------------

/**
 * Simulates the guard logic in packages/preload/src/index.ts
 * Returns true if the call would be allowed, false if it would be rejected.
 */
const simulateInvokeGuard = (channel: string): boolean =>
  ALLOWED_INVOKE_CHANNELS.has(channel);

const simulateSendGuard = (channel: string): boolean =>
  ALLOWED_SEND_CHANNELS.has(channel);

const simulateOnGuard = (channel: string): boolean =>
  ALLOWED_ON_CHANNELS.has(channel);

describe('guard logic — allowed channels pass', () => {
  it('ledger-get-address invoke is allowed', () => {
    expect(simulateInvokeGuard('ledger-get-address')).toBe(true);
  });

  it('CHECK_FOR_UPDATE_PENDING send is allowed', () => {
    expect(simulateSendGuard('CHECK_FOR_UPDATE_PENDING')).toBe(true);
  });

  it('clorio-event on is allowed', () => {
    expect(simulateOnGuard('clorio-event')).toBe(true);
  });

  it('deeplink on is allowed', () => {
    expect(simulateOnGuard('deeplink')).toBe(true);
  });

  it('error on is allowed (zkapp error responses)', () => {
    expect(simulateOnGuard('error')).toBe(true);
  });

  it('open-win invoke is allowed (dApp browser)', () => {
    expect(simulateInvokeGuard('open-win')).toBe(true);
  });
});

describe('guard logic — unknown channels are blocked', () => {
  const unknownChannels = [
    'arbitrary-channel',
    'hack',
    'node:fs',
    'execute',
    '',
    'ledger',       // partial match must not be allowed
    'CHECK',        // partial match must not be allowed
    'clorio',       // prefix must not be allowed without full name
  ];

  for (const ch of unknownChannels) {
    it(`invoke("${ch}") is blocked`, () => {
      expect(simulateInvokeGuard(ch)).toBe(false);
    });

    it(`send("${ch}") is blocked`, () => {
      expect(simulateSendGuard(ch)).toBe(false);
    });

    it(`on("${ch}") is blocked`, () => {
      expect(simulateOnGuard(ch)).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// Channel set disjointness
// Invoke channels should not overlap with send channels (different semantics)
// ---------------------------------------------------------------------------
describe('allowlist disjointness', () => {
  it('INVOKE and SEND channels do not overlap', () => {
    const overlap = [...ALLOWED_INVOKE_CHANNELS].filter(ch => ALLOWED_SEND_CHANNELS.has(ch));
    expect(overlap).toHaveLength(0);
  });

  it('no ledger channel appears in SEND (ledger uses invoke/request-response)', () => {
    const ledgerInSend = [...ALLOWED_SEND_CHANNELS].filter(ch => ch.startsWith('ledger-'));
    expect(ledgerInSend).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Naming convention checks
// ---------------------------------------------------------------------------
describe('channel naming conventions', () => {
  it('all INVOKE channels use kebab-case', () => {
    for (const ch of ALLOWED_INVOKE_CHANNELS) {
      // kebab-case: lowercase letters, digits, hyphens only
      expect(ch).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('all clorio-* ON channels follow the clorio-<verb>-<noun> pattern', () => {
    const clorioChannels = [...ALLOWED_ON_CHANNELS].filter(ch => ch.startsWith('clorio-'));
    expect(clorioChannels.length).toBeGreaterThan(0);
    for (const ch of clorioChannels) {
      // Must have at least one hyphen after "clorio-"
      expect(ch.split('-').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('update-related channels use UPPER_SNAKE_CASE consistently', () => {
    const updateChannels = [
      'CHECK_FOR_UPDATE_PENDING',
      'CHECK_FOR_UPDATE_SUCCESS',
      'UPDATE_ERROR',
      'DOWNLOAD_UPDATE_SUCCESS',
      'DOWNLOAD_UPDATE_FAILURE',
    ];
    for (const ch of updateChannels) {
      expect(ch).toMatch(/^[A-Z_]+$/);
      // All must be in their respective allowlists
      const inSend = ALLOWED_SEND_CHANNELS.has(ch);
      const inOn = ALLOWED_ON_CHANNELS.has(ch);
      expect(inSend || inOn).toBe(true);
    }
  });
});
