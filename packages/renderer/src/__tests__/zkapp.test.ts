/**
 * Unit tests for getCurrentNetConfig and NET_CONFIG_TYPE
 *
 * These tests act as regression guards for the B2 fix:
 * getCurrentNetConfig() must NEVER return a hardcoded network.
 * It must always reflect the persisted network settings or the env fallback.
 *
 * Run with:  pnpm vitest run -r packages/renderer --reporter=verbose
 */

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {getCurrentNetConfig, NET_CONFIG_TYPE, NET_CONFIG_NOT_SUPPORT_STAKING} from '../tools/zkapp';

// ---------------------------------------------------------------------------
// localStorage mock helpers
// ---------------------------------------------------------------------------

const setNetworkSettings = (settings: Record<string, string>) => {
  localStorage.setItem('networkSettings', JSON.stringify(settings));
};

const clearNetworkSettings = () => {
  localStorage.removeItem('networkSettings');
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearNetworkSettings();
});

afterEach(() => {
  clearNetworkSettings();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// NET_CONFIG_TYPE — constant shape
// ---------------------------------------------------------------------------
describe('NET_CONFIG_TYPE', () => {
  it('has a Mainnet entry equal to "mainnet"', () => {
    expect(NET_CONFIG_TYPE.Mainnet).toBe('mainnet');
  });

  it('has a Devnet entry equal to "devnet"', () => {
    expect(NET_CONFIG_TYPE.Devnet).toBe('devnet');
  });

  it('has an Unknown entry equal to "unknown"', () => {
    expect(NET_CONFIG_TYPE.Unknown).toBe('unknown');
  });

  it('does NOT contain a Berkeley entry (decommissioned network)', () => {
    expect((NET_CONFIG_TYPE as Record<string, string>)['Berkeley']).toBeUndefined();
  });

  it('does NOT contain a Testworld2 entry (decommissioned network)', () => {
    expect((NET_CONFIG_TYPE as Record<string, string>)['Testworld2']).toBeUndefined();
  });

  it('does NOT contain a berkeley string value', () => {
    expect(Object.values(NET_CONFIG_TYPE)).not.toContain('berkeley');
  });

  it('does NOT contain a testworld2 string value', () => {
    expect(Object.values(NET_CONFIG_TYPE)).not.toContain('testworld2');
  });

  it('contains exactly 3 entries (Mainnet, Devnet, Unknown)', () => {
    expect(Object.keys(NET_CONFIG_TYPE)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// getCurrentNetConfig — regression guard for the B2 fix
// The function must NEVER return hardcoded Berkeley.
// ---------------------------------------------------------------------------
describe('getCurrentNetConfig — never returns hardcoded Berkeley', () => {
  it('does not return netType "berkeley" when localStorage is empty', () => {
    const config = getCurrentNetConfig();
    expect(config.netType).not.toBe('berkeley');
  });

  it('does not return name "Berkeley" when localStorage is empty', () => {
    const config = getCurrentNetConfig();
    expect(config.name).not.toBe('Berkeley');
  });

  it('does not return netType "testworld2" in any scenario', () => {
    const config = getCurrentNetConfig();
    expect(config.netType).not.toBe('testworld2');
  });
});

// ---------------------------------------------------------------------------
// getCurrentNetConfig — localStorage scenarios
// ---------------------------------------------------------------------------
describe('getCurrentNetConfig — reads from localStorage', () => {
  it('returns the network from localStorage when network key is set', () => {
    setNetworkSettings({network: 'mainnet', name: 'Mainnet'});
    const config = getCurrentNetConfig();
    expect(config.netType).toBe('mainnet');
  });

  it('returns the name from localStorage when name key is set', () => {
    setNetworkSettings({network: 'mainnet', name: 'Mainnet'});
    const config = getCurrentNetConfig();
    expect(config.name).toBe('Mainnet');
  });

  it('returns devnet netType when localStorage has network: "devnet"', () => {
    setNetworkSettings({network: 'devnet', name: 'Devnet'});
    const config = getCurrentNetConfig();
    expect(config.netType).toBe('devnet');
  });

  it('returns devnet name when localStorage has name: "Devnet"', () => {
    setNetworkSettings({network: 'devnet', name: 'Devnet'});
    const config = getCurrentNetConfig();
    expect(config.name).toBe('Devnet');
  });

  it('falls back to label when network key is missing', () => {
    setNetworkSettings({label: 'mainnet', name: 'Mainnet'});
    const config = getCurrentNetConfig();
    expect(config.netType).toBe('mainnet');
  });

  it('uses netType "unknown" when both network and label are absent', () => {
    setNetworkSettings({name: 'Some Network'});
    const config = getCurrentNetConfig();
    expect(config.netType).toBe('unknown');
  });

  it('uses name from settings when name key is present', () => {
    setNetworkSettings({network: 'mainnet', name: 'My Mainnet'});
    const config = getCurrentNetConfig();
    expect(config.name).toBe('My Mainnet');
  });

  it('falls back to netType as name when name is absent in settings', () => {
    setNetworkSettings({network: 'mainnet'});
    const config = getCurrentNetConfig();
    expect(config.name).toBe('mainnet');
  });

  it('handles an arbitrary custom network name in localStorage', () => {
    setNetworkSettings({network: 'my-custom-net', name: 'My Custom Network'});
    const config = getCurrentNetConfig();
    expect(config.netType).toBe('my-custom-net');
    expect(config.name).toBe('My Custom Network');
  });
});

// ---------------------------------------------------------------------------
// getCurrentNetConfig — env variable fallback
// ---------------------------------------------------------------------------
describe('getCurrentNetConfig — env variable fallback', () => {
  it('falls back to VITE_REACT_APP_NETWORK env var when localStorage is empty', () => {
    vi.stubEnv('VITE_REACT_APP_NETWORK', 'mainnet');
    const config = getCurrentNetConfig();
    expect(config.netType).toBe('mainnet');
  });

  it('falls back to devnet from env var when localStorage is empty', () => {
    vi.stubEnv('VITE_REACT_APP_NETWORK', 'devnet');
    const config = getCurrentNetConfig();
    expect(config.netType).toBe('devnet');
  });

  it('localStorage takes precedence over env var', () => {
    vi.stubEnv('VITE_REACT_APP_NETWORK', 'devnet');
    setNetworkSettings({network: 'mainnet', name: 'Mainnet'});
    const config = getCurrentNetConfig();
    // localStorage wins over env
    expect(config.netType).toBe('mainnet');
  });
});

// ---------------------------------------------------------------------------
// getCurrentNetConfig — fallback to Mainnet as last resort
// ---------------------------------------------------------------------------
describe('getCurrentNetConfig — final fallback to Mainnet', () => {
  it('returns "mainnet" as netType when localStorage is empty and env is unset', () => {
    vi.stubEnv('VITE_REACT_APP_NETWORK', '');
    const config = getCurrentNetConfig();
    // Empty string is falsy → should fall through to 'Mainnet'
    expect(config.netType).toBe('Mainnet');
  });

  it('returns "Mainnet" as name when no settings or env are available', () => {
    vi.stubEnv('VITE_REACT_APP_NETWORK', '');
    const config = getCurrentNetConfig();
    expect(config.name).toBe('Mainnet');
  });
});

// ---------------------------------------------------------------------------
// getCurrentNetConfig — malformed localStorage resilience
// ---------------------------------------------------------------------------
describe('getCurrentNetConfig — resilience to malformed localStorage', () => {
  it('does not throw when localStorage contains invalid JSON', () => {
    localStorage.setItem('networkSettings', '{invalid_json:::}');
    expect(() => getCurrentNetConfig()).not.toThrow();
  });

  it('falls back gracefully when localStorage contains invalid JSON', () => {
    localStorage.setItem('networkSettings', '{invalid_json:::}');
    vi.stubEnv('VITE_REACT_APP_NETWORK', 'mainnet');
    const config = getCurrentNetConfig();
    // Must fall back to env or default — must not crash
    expect(config.netType).toBeDefined();
    expect(typeof config.netType).toBe('string');
  });

  it('does not throw when localStorage returns null for key', () => {
    // Removing key ensures getItem returns null
    localStorage.removeItem('networkSettings');
    expect(() => getCurrentNetConfig()).not.toThrow();
  });

  it('does not throw when localStorage contains an empty object', () => {
    localStorage.setItem('networkSettings', '{}');
    expect(() => getCurrentNetConfig()).not.toThrow();
  });

  it('handles null-valued fields in localStorage gracefully', () => {
    localStorage.setItem('networkSettings', JSON.stringify({network: null, name: null}));
    const config = getCurrentNetConfig();
    expect(config).toBeDefined();
    expect(typeof config.netType).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// getCurrentNetConfig — return type shape
// ---------------------------------------------------------------------------
describe('getCurrentNetConfig — return type', () => {
  it('always returns an object', () => {
    const config = getCurrentNetConfig();
    expect(typeof config).toBe('object');
    expect(config).not.toBeNull();
  });

  it('always returns an object with a netType string', () => {
    const config = getCurrentNetConfig();
    expect(typeof config.netType).toBe('string');
    expect(config.netType.length).toBeGreaterThan(0);
  });

  it('always returns an object with a name string', () => {
    const config = getCurrentNetConfig();
    expect(typeof config.name).toBe('string');
    expect(config.name.length).toBeGreaterThan(0);
  });

  it('is synchronous (does not return a Promise)', () => {
    const result = getCurrentNetConfig();
    expect(result).not.toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// NET_CONFIG_NOT_SUPPORT_STAKING — only Unknown should block staking
// ---------------------------------------------------------------------------
describe('NET_CONFIG_NOT_SUPPORT_STAKING', () => {
  it('is an array', () => {
    expect(Array.isArray(NET_CONFIG_NOT_SUPPORT_STAKING)).toBe(true);
  });

  it('contains the Unknown network type', () => {
    expect(NET_CONFIG_NOT_SUPPORT_STAKING).toContain(NET_CONFIG_TYPE.Unknown);
  });

  it('does NOT block staking on Mainnet', () => {
    expect(NET_CONFIG_NOT_SUPPORT_STAKING).not.toContain(NET_CONFIG_TYPE.Mainnet);
  });

  it('does NOT block staking on Devnet', () => {
    expect(NET_CONFIG_NOT_SUPPORT_STAKING).not.toContain(NET_CONFIG_TYPE.Devnet);
  });

  it('does NOT block staking on berkeley (no longer a valid type)', () => {
    expect(NET_CONFIG_NOT_SUPPORT_STAKING).not.toContain('berkeley');
  });
});
