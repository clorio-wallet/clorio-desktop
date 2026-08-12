/**
 * Unit tests for fee utility functions
 *
 * Run with:  pnpm vitest run -r packages/renderer --reporter=verbose
 */

import {describe, it, expect} from 'vitest';
import {feeOrDefault} from '../tools/fees';
import {DEFAULT_FEE, MINIMUM_FEE, DELEGATION_FEE_THRESHOLD} from '../tools/const';
import {feeGreaterThanMinimum} from '../tools/utils';
import {toNanoMINA, toMINA} from '../tools/mina';

// ---------------------------------------------------------------------------
// feeOrDefault
// ---------------------------------------------------------------------------
describe('feeOrDefault', () => {
  it('returns the DEFAULT_FEE when called with no argument', () => {
    expect(feeOrDefault()).toBe(DEFAULT_FEE);
  });

  it('returns DEFAULT_FEE when fee is 0', () => {
    expect(feeOrDefault(0)).toBe(DEFAULT_FEE);
  });

  it('returns DEFAULT_FEE when fee is undefined', () => {
    expect(feeOrDefault(undefined)).toBe(DEFAULT_FEE);
  });

  it('returns the provided fee when it is a positive number', () => {
    expect(feeOrDefault(0.5)).toBe(0.5);
  });

  it('returns DEFAULT_FEE when fee is negative', () => {
    // negative is falsy when checked as > 0
    expect(feeOrDefault(-1)).toBe(DEFAULT_FEE);
  });

  it('returns the fee when it equals DEFAULT_FEE exactly', () => {
    expect(feeOrDefault(DEFAULT_FEE)).toBe(DEFAULT_FEE);
  });

  it('returns the fee when it is very small but positive (above 0)', () => {
    expect(feeOrDefault(0.000001)).toBe(0.000001);
  });

  it('returns a large fee unchanged', () => {
    expect(feeOrDefault(100)).toBe(100);
  });

  it('always returns a number', () => {
    expect(typeof feeOrDefault()).toBe('number');
    expect(typeof feeOrDefault(0)).toBe('number');
    expect(typeof feeOrDefault(1)).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_FEE constant sanity
// ---------------------------------------------------------------------------
describe('DEFAULT_FEE constant', () => {
  it('is 0.1 MINA', () => {
    expect(DEFAULT_FEE).toBe(0.1);
  });

  it('in nanomina equals 100_000_000', () => {
    expect(toNanoMINA(DEFAULT_FEE)).toBe(100_000_000);
  });
});

// ---------------------------------------------------------------------------
// MINIMUM_FEE constant sanity
// ---------------------------------------------------------------------------
describe('MINIMUM_FEE constant', () => {
  it('is expressed in nanomina (1_000_000)', () => {
    expect(MINIMUM_FEE).toBe(1_000_000);
  });

  it('equals 0.001 MINA', () => {
    expect(toMINA(MINIMUM_FEE)).toBe(0.001);
  });

  it('is less than DEFAULT_FEE in nanomina', () => {
    expect(MINIMUM_FEE).toBeLessThan(toNanoMINA(DEFAULT_FEE));
  });
});

// ---------------------------------------------------------------------------
// DELEGATION_FEE_THRESHOLD constant sanity
// ---------------------------------------------------------------------------
describe('DELEGATION_FEE_THRESHOLD constant', () => {
  it('is 2_000_000_000 nanomina (2 MINA)', () => {
    expect(DELEGATION_FEE_THRESHOLD).toBe(2_000_000_000);
  });

  it('equals 2 MINA', () => {
    expect(toMINA(DELEGATION_FEE_THRESHOLD)).toBe(2);
  });

  it('is greater than DEFAULT_FEE in nanomina', () => {
    expect(DELEGATION_FEE_THRESHOLD).toBeGreaterThan(toNanoMINA(DEFAULT_FEE));
  });
});

// ---------------------------------------------------------------------------
// feeGreaterThanMinimum — from utils.ts
// ---------------------------------------------------------------------------
describe('feeGreaterThanMinimum', () => {
  it('returns true for fee equal to MINIMUM_FEE in MINA (0.001)', () => {
    expect(feeGreaterThanMinimum(0.001)).toBe(true);
  });

  it('returns true for a fee above the minimum (0.1 MINA)', () => {
    expect(feeGreaterThanMinimum(0.1)).toBe(true);
  });

  it('returns true for the default fee (0.1 MINA)', () => {
    expect(feeGreaterThanMinimum(DEFAULT_FEE)).toBe(true);
  });

  it('returns false for a fee below the minimum (0.0009 MINA)', () => {
    expect(feeGreaterThanMinimum(0.0009)).toBe(false);
  });

  it('returns false for fee 0', () => {
    expect(feeGreaterThanMinimum(0)).toBe(false);
  });

  it('returns false for a falsy fee (undefined)', () => {
    expect(feeGreaterThanMinimum(undefined as unknown as number)).toBe(false);
  });

  it('returns false for a negative fee', () => {
    expect(feeGreaterThanMinimum(-0.1)).toBe(false);
  });

  it('returns true for a very high fee (2 MINA)', () => {
    expect(feeGreaterThanMinimum(2)).toBe(true);
  });

  it('minimum boundary: exactly 0.001 MINA passes', () => {
    const exactMinimumInMINA = toMINA(MINIMUM_FEE);
    expect(feeGreaterThanMinimum(exactMinimumInMINA)).toBe(true);
  });

  it('one nanomina below minimum fails', () => {
    // MINIMUM_FEE - 1 nanomina expressed in MINA
    const belowMinimum = (MINIMUM_FEE - 1) / 1e9;
    expect(feeGreaterThanMinimum(belowMinimum)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Fee threshold checks (delegation high-fee warning boundary)
// ---------------------------------------------------------------------------
describe('delegation fee threshold boundary', () => {
  it('a fee of exactly 2 MINA in nanomina equals the threshold', () => {
    expect(toNanoMINA(2)).toBe(DELEGATION_FEE_THRESHOLD);
  });

  it('a fee of 1.99 MINA is below the threshold', () => {
    expect(toNanoMINA(1.99)).toBeLessThan(DELEGATION_FEE_THRESHOLD);
  });

  it('a fee of 2.01 MINA is above the threshold', () => {
    expect(toNanoMINA(2.01)).toBeGreaterThan(DELEGATION_FEE_THRESHOLD);
  });

  it('DEFAULT_FEE (0.1 MINA) is well below the delegation threshold', () => {
    expect(toNanoMINA(DEFAULT_FEE)).toBeLessThan(DELEGATION_FEE_THRESHOLD);
  });
});
