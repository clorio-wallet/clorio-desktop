/**
 * Unit tests for MINA unit conversion utilities
 * These functions are pure and have no external dependencies — ideal first test targets.
 *
 * Run with:  pnpm vitest run -r packages/renderer --reporter=verbose
 */

import {describe, it, expect} from 'vitest';
import {toNanoMINA, toMINA, toLongMINA} from '../tools/mina';

// ---------------------------------------------------------------------------
// toNanoMINA — converts MINA → nanomina (× 1e9)
// ---------------------------------------------------------------------------
describe('toNanoMINA', () => {
  it('converts 1 MINA to 1_000_000_000 nanomina', () => {
    expect(toNanoMINA(1)).toBe(1_000_000_000);
  });

  it('converts 0 MINA to 0 nanomina', () => {
    expect(toNanoMINA(0)).toBe(0);
  });

  it('converts fractional MINA correctly (0.1 MINA → 100_000_000 nanomina)', () => {
    expect(toNanoMINA(0.1)).toBe(100_000_000);
  });

  it('converts the minimum fee (0.001 MINA → 1_000_000 nanomina)', () => {
    expect(toNanoMINA(0.001)).toBe(1_000_000);
  });

  it('handles large amounts (1_000_000 MINA)', () => {
    expect(toNanoMINA(1_000_000)).toBe(1_000_000_000_000_000);
  });

  it('accepts a string input', () => {
    expect(toNanoMINA('2')).toBe(2_000_000_000);
  });

  it('accepts a string with decimal input', () => {
    expect(toNanoMINA('0.5')).toBe(500_000_000);
  });

  it('round-trips correctly: toMINA(toNanoMINA(x)) ≈ x for typical amounts', () => {
    const original = 42.123;
    const nano = toNanoMINA(original);
    const back = toMINA(nano);
    // toMINA rounds to 3 decimal places, so we compare at that precision
    expect(back).toBeCloseTo(original, 3);
  });
});

// ---------------------------------------------------------------------------
// toMINA — converts nanomina → MINA (× 1e-9), rounded to 3 decimal places
// ---------------------------------------------------------------------------
describe('toMINA', () => {
  it('converts 1_000_000_000 nanomina to 1 MINA', () => {
    expect(toMINA(1_000_000_000)).toBe(1);
  });

  it('converts 0 nanomina to 0 MINA', () => {
    expect(toMINA(0)).toBe(0);
  });

  it('converts 100_000_000 nanomina to 0.1 MINA', () => {
    expect(toMINA(100_000_000)).toBe(0.1);
  });

  it('rounds to 3 decimal places', () => {
    // 1_234_567_890 nanomina = 1.23456789 MINA, rounded to 1.235
    expect(toMINA(1_234_567_890)).toBe(1.235);
  });

  it('converts the minimum fee (1_000_000 nanomina → 0.001 MINA)', () => {
    expect(toMINA(1_000_000)).toBe(0.001);
  });

  it('accepts a string input', () => {
    expect(toMINA('2000000000')).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// toLongMINA — converts nanomina → MINA with full precision (no rounding cap)
// ---------------------------------------------------------------------------
describe('toLongMINA', () => {
  it('converts 1_000_000_000 nanomina to "1" (no trailing zeros)', () => {
    expect(toLongMINA(1_000_000_000)).toBe('1');
  });

  it('converts 0 nanomina to "0"', () => {
    expect(toLongMINA(0)).toBe('0');
  });

  it('preserves full precision for 1_234_567_890 nanomina', () => {
    // Should NOT round — must preserve all significant digits
    expect(toLongMINA(1_234_567_890)).toBe('1.23456789');
  });

  it('converts 100_000_000 nanomina to "0.1"', () => {
    expect(toLongMINA(100_000_000)).toBe('0.1');
  });

  it('converts 1_000 nanomina (1 micromina) with full precision', () => {
    expect(toLongMINA(1_000)).toBe('0.000001');
  });

  it('returns a string type', () => {
    expect(typeof toLongMINA(500_000_000)).toBe('string');
  });

  it('accepts string input', () => {
    expect(toLongMINA('3000000000')).toBe('3');
  });

  it('differs from toMINA when extra precision is present', () => {
    const nano = 1_234_567_890;
    // toMINA rounds to 3dp → 1.235
    // toLongMINA keeps all digits → '1.23456789'
    expect(+toLongMINA(nano)).not.toBe(toMINA(nano));
  });
});

// ---------------------------------------------------------------------------
// Cross-function consistency
// ---------------------------------------------------------------------------
describe('unit conversion consistency', () => {
  const testCases = [0, 0.001, 0.1, 1, 10, 100, 1000, 50000];

  testCases.forEach(mina => {
    it(`toMINA(toNanoMINA(${mina})) should approximately equal ${mina}`, () => {
      expect(toMINA(toNanoMINA(mina))).toBeCloseTo(mina, 3);
    });
  });

  it('toNanoMINA and toMINA are inverse operations for whole numbers', () => {
    for (const whole of [1, 2, 5, 100, 1000]) {
      expect(toMINA(toNanoMINA(whole))).toBe(whole);
    }
  });
});
