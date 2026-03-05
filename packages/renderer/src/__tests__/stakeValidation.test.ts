/**
 * Unit tests for Stake validation helpers
 *
 * These are pure functions with zero external dependencies — fast and deterministic.
 * They cover the critical path that gates every delegation broadcast.
 *
 * Run with:  pnpm vitest run -r packages/renderer --reporter=verbose
 */

import {describe, it, expect} from 'vitest';
import {checkBalance, initialDelegateData} from '../pages/stake/StakeHelper';
import type {IBalanceData} from '../contexts/balance/BalanceTypes';
import {toNanoMINA} from '../tools/mina';
import {DEFAULT_FEE, MINIMUM_FEE} from '../tools/const';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeBalance = (liquidUnconfirmed: number): IBalanceData => ({
  liquid: String(liquidUnconfirmed),
  liquidUnconfirmed: String(liquidUnconfirmed),
  locked: '0',
  total: String(liquidUnconfirmed),
  unconfirmedTotal: '0',
});

// ---------------------------------------------------------------------------
// checkBalance — throws when fee > available liquidUnconfirmed balance
// ---------------------------------------------------------------------------
describe('checkBalance', () => {
  it('does not throw when balance comfortably covers the fee', () => {
    const balance = makeBalance(toNanoMINA(10)); // 10 MINA
    expect(() => checkBalance(toNanoMINA(DEFAULT_FEE), balance)).not.toThrow();
  });

  it('does not throw when balance exactly equals the fee', () => {
    const fee = toNanoMINA(DEFAULT_FEE); // 100_000_000 nanomina
    const balance = makeBalance(fee);
    expect(() => checkBalance(fee, balance)).not.toThrow();
  });

  it('throws when balance is 1 nanomina less than the fee', () => {
    const fee = toNanoMINA(DEFAULT_FEE);
    const balance = makeBalance(fee - 1);
    expect(() => checkBalance(fee, balance)).toThrow("You don't have enough funds");
  });

  it('throws when balance is 0 and fee is positive', () => {
    const balance = makeBalance(0);
    expect(() => checkBalance(toNanoMINA(DEFAULT_FEE), balance)).toThrow(
      "You don't have enough funds",
    );
  });

  it('throws when balance is undefined', () => {
    // undefined liquidUnconfirmed defaults to 0 inside the function
    expect(() => checkBalance(toNanoMINA(DEFAULT_FEE), undefined)).toThrow(
      "You don't have enough funds",
    );
  });

  it('does not throw when fee is 0 and balance is 0', () => {
    const balance = makeBalance(0);
    expect(() => checkBalance(0, balance)).not.toThrow();
  });

  it('does not throw when fee is the minimum fee and balance is sufficient', () => {
    const balance = makeBalance(toNanoMINA(1)); // 1 MINA
    expect(() => checkBalance(MINIMUM_FEE, balance)).not.toThrow();
  });

  it('throws when fee is the minimum fee but balance is 0', () => {
    const balance = makeBalance(0);
    expect(() => checkBalance(MINIMUM_FEE, balance)).toThrow("You don't have enough funds");
  });

  it('does not throw for a very large balance and large fee', () => {
    const balance = makeBalance(toNanoMINA(1_000_000)); // 1M MINA
    const fee = toNanoMINA(500_000);                   // 500K MINA fee
    expect(() => checkBalance(fee, balance)).not.toThrow();
  });

  it('throws when fee is 1 nanomina more than the large balance', () => {
    const balance = makeBalance(toNanoMINA(500_000));
    const fee = toNanoMINA(500_000) + 1;
    expect(() => checkBalance(fee, balance)).toThrow("You don't have enough funds");
  });

  it('does not throw for the delegation threshold fee (2 MINA) with sufficient balance', () => {
    const balance = makeBalance(toNanoMINA(100));
    const delegationThresholdFee = 2_000_000_000; // 2 MINA in nanomina
    expect(() => checkBalance(delegationThresholdFee, balance)).not.toThrow();
  });

  it('throws for the delegation threshold fee with exact balance equal to fee - 1', () => {
    const delegationThresholdFee = 2_000_000_000;
    const balance = makeBalance(delegationThresholdFee - 1);
    expect(() => checkBalance(delegationThresholdFee, balance)).toThrow(
      "You don't have enough funds",
    );
  });

  it('uses liquidUnconfirmed (not total) as the available amount', () => {
    // total might be higher due to locked funds — only liquidUnconfirmed is spendable
    const balance: IBalanceData = {
      liquid: String(toNanoMINA(10)),
      liquidUnconfirmed: String(toNanoMINA(0.05)), // only 0.05 MINA spendable
      locked: String(toNanoMINA(9.95)),
      total: String(toNanoMINA(10)),
      unconfirmedTotal: '0',
    };
    const fee = toNanoMINA(DEFAULT_FEE); // 0.1 MINA > 0.05 MINA liquidUnconfirmed
    expect(() => checkBalance(fee, balance)).toThrow("You don't have enough funds");
  });

  it('passes when liquidUnconfirmed is sufficient even if total would not cover', () => {
    // Edge case: liquidUnconfirmed is the only value that matters
    const balance: IBalanceData = {
      liquid: '0',
      liquidUnconfirmed: String(toNanoMINA(1)), // 1 MINA spendable
      locked: '0',
      total: '0',
      unconfirmedTotal: '0',
    };
    expect(() => checkBalance(toNanoMINA(DEFAULT_FEE), balance)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// checkBalance error message content
// ---------------------------------------------------------------------------
describe('checkBalance error message', () => {
  it('error message matches the exact string consumers depend on', () => {
    // Components catch and display this message — it must not change silently
    const balance = makeBalance(0);
    let errorMessage = '';
    try {
      checkBalance(toNanoMINA(DEFAULT_FEE), balance);
    } catch (e) {
      errorMessage = (e as Error).message;
    }
    expect(errorMessage).toBe("You don't have enough funds");
  });
});

// ---------------------------------------------------------------------------
// checkBalance boundary precision
// ---------------------------------------------------------------------------
describe('checkBalance boundary precision', () => {
  it('exact boundary: balance === fee passes', () => {
    const fee = 123_456_789; // arbitrary nanomina value
    const balance = makeBalance(fee);
    expect(() => checkBalance(fee, balance)).not.toThrow();
  });

  it('exact boundary: balance === fee - 1 fails', () => {
    const fee = 123_456_789;
    const balance = makeBalance(fee - 1);
    expect(() => checkBalance(fee, balance)).toThrow();
  });

  it('exact boundary: balance === fee + 1 passes', () => {
    const fee = 123_456_789;
    const balance = makeBalance(fee + 1);
    expect(() => checkBalance(fee, balance)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// initialDelegateData shape
// ---------------------------------------------------------------------------
describe('initialDelegateData', () => {
  it('has an empty publicKey', () => {
    expect(initialDelegateData.publicKey).toBe('');
  });

  it('is an object with a publicKey property', () => {
    expect(initialDelegateData).toHaveProperty('publicKey');
  });

  it('publicKey is a string', () => {
    expect(typeof initialDelegateData.publicKey).toBe('string');
  });

  it('has no name property set (optional field is absent or undefined)', () => {
    // name is optional — initial state should not have a stale name
    expect(initialDelegateData.name).toBeUndefined();
  });

  it('is safe to spread without mutating the original', () => {
    const copy = {...initialDelegateData, publicKey: 'B62qtest'};
    expect(copy.publicKey).toBe('B62qtest');
    // original must be unchanged
    expect(initialDelegateData.publicKey).toBe('');
  });
});
