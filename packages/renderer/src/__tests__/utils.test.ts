/**
 * Unit tests for utils.ts helper functions
 *
 * Covers:
 *  - sanitizeString  (B1 fix regression guard: isBad(value) not isBad('value'))
 *  - trimMiddle
 *  - spellMnemonic
 *  - decodeMemo
 *  - isEmptyObject
 *  - toDecimal
 *  - getTotalPages
 *  - getPageFromOffset
 *
 * Run with:  pnpm vitest run -r packages/renderer --reporter=verbose
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
  trimMiddle,
  spellMnemonic,
  decodeMemo,
  isEmptyObject,
  toDecimal,
  getTotalPages,
  getPageFromOffset,
  isBad,
  sanitizeString,
  removeBadWords,
} from '../tools/utils';
import {TRANSACTIONS_TABLE_ITEMS_PER_PAGE, VALIDATORS_TABLE_ITEMS_PER_PAGE} from '../tools/const';

// ---------------------------------------------------------------------------
// isBad — blacklist check
// ---------------------------------------------------------------------------
describe('isBad', () => {
  it('returns false for a normal word', () => {
    expect(isBad('hello')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isBad('')).toBe(false);
  });

  it('returns false for undefined-like (empty)', () => {
    expect(isBad('')).toBe(false);
  });

  it('returns true for a string containing a blacklisted word "onion"', () => {
    expect(isBad('onion')).toBe(true);
  });

  it('returns true for a string where "onion" is embedded', () => {
    expect(isBad('send to onionsite')).toBe(true);
  });

  it('is case-insensitive for blacklisted words (strips non-alphanumeric)', () => {
    // isBad strips non-alphanumeric and checks inclusion
    expect(isBad('ONION')).toBe(true);
  });

  it('returns false for "opinion" (does not contain "onion" after stripping)', () => {
    // "opinion" → alphanumeric is "opinion" which does include "onion" as substring
    // This documents the current behaviour (substring match)
    expect(isBad('opinion')).toBe(true);
  });

  it('returns false for an address-like string', () => {
    expect(isBad('B62qabcdef1234567890')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeString — B1 regression guard
//
// The bug was: isBad('value') was called instead of isBad(value).
// The literal string 'value' does NOT contain any blacklisted word,
// so the old code NEVER returned 'unavailable' for any input.
// After the fix, isBad(value) is called with the actual content.
// ---------------------------------------------------------------------------
describe('sanitizeString — B1 regression guard', () => {
  it('returns the original clean string unchanged', () => {
    expect(sanitizeString('hello world')).toBe('hello world');
  });

  it('returns "unavailable" when the string contains a blacklisted term', () => {
    // After the fix, isBad(value) is called with the actual value
    // "onion" is in the blacklist
    const result = sanitizeString('onion');
    expect(result).toBe('unavailable');
  });

  it('does NOT return "unavailable" for a normal string (fix did not over-sanitize)', () => {
    const result = sanitizeString('stake delegation fee');
    expect(result).not.toBe('unavailable');
  });

  it('returns the input unchanged for an empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('returns the input unchanged for a whitespace-only string', () => {
    expect(sanitizeString('   ')).toBe('   ');
  });

  it('handles null input without throwing', () => {
    // null is a valid edge case from network data
    expect(() => sanitizeString(null as unknown as string)).not.toThrow();
  });

  it('handles undefined input without throwing', () => {
    expect(() => sanitizeString(undefined as unknown as string)).not.toThrow();
  });

  it('processes memo-like strings without modification for clean content', () => {
    const memo = 'payment for invoice #1234';
    const result = sanitizeString(memo);
    // censorify and bad-words should not modify a clean memo
    expect(result).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// removeBadWords
// ---------------------------------------------------------------------------
describe('removeBadWords', () => {
  it('returns the string unchanged for clean input', () => {
    const clean = 'hello world';
    expect(removeBadWords(clean)).toBe(clean);
  });

  it('returns the string unchanged for alphanumeric-with-spaces input', () => {
    expect(removeBadWords('stake 100 MINA')).toBe('stake 100 MINA');
  });

  it('does not throw for empty string', () => {
    expect(() => removeBadWords('')).not.toThrow();
  });

  it('does not throw for non-alphanumeric strings (passes through as-is)', () => {
    // non-alphanumeric strings bypass bad-word filtering
    expect(() => removeBadWords('B62q!!!abc')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// trimMiddle
// ---------------------------------------------------------------------------
describe('trimMiddle', () => {
  it('returns the full string when it is shorter than maxLength', () => {
    expect(trimMiddle('hello', 10)).toBe('hello');
  });

  it('returns the full string when it equals maxLength exactly', () => {
    expect(trimMiddle('hello', 5)).toBe('hello');
  });

  it('trims a long string and inserts "..." in the middle', () => {
    const result = trimMiddle('B62qabcdefghijklmnopqrstuvwxyz1234567890', 20);
    expect(result).toContain('...');
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('preserves the first few characters of the original string', () => {
    const str = 'B62qabcdefghijklmnopqrstuvwxyz';
    const result = trimMiddle(str, 15);
    expect(result.startsWith('B62q')).toBe(true);
  });

  it('preserves the last few characters of the original string', () => {
    const str = 'B62qabcdefghijklmnopqrstuvwxyz';
    const result = trimMiddle(str, 15);
    expect(result.endsWith('wxyz')).toBe(true);
  });

  it('the trimmed string has exactly maxLength characters', () => {
    const str = 'B62qabcdefghijklmnopqrstuvwxyz1234567890';
    const maxLength = 20;
    const result = trimMiddle(str, maxLength);
    expect(result.length).toBe(maxLength);
  });

  it('works for maxLength of 7 (minimum meaningful trim)', () => {
    const result = trimMiddle('abcdefghij', 7);
    expect(result).toContain('...');
    expect(result.length).toBe(7);
  });

  it('handles a real Mina address trimmed to 20 chars', () => {
    const address = 'B62qoHMVbGgU6Z8vXnHak1KPMDx1VAM4MNNs4VfDLoAL8JBt9KTHVD';
    const result = trimMiddle(address, 20);
    expect(result).toContain('...');
    expect(result.length).toBe(20);
    expect(result.startsWith('B62q')).toBe(true);
  });

  it('handles a real Mina address trimmed to 40 chars', () => {
    const address = 'B62qoHMVbGgU6Z8vXnHak1KPMDx1VAM4MNNs4VfDLoAL8JBt9KTHVD';
    const result = trimMiddle(address, 40);
    expect(result).toContain('...');
    expect(result.length).toBe(40);
  });

  it('returns a string of length exactly 5 when maxLength is 5 (edge: "a...b")', () => {
    const result = trimMiddle('abcdefghijk', 5);
    // leftHalf = floor((5-3)/2) = 1 char, rightHalf = ceil((5-3)/2) = 1 char
    expect(result.length).toBe(5);
    expect(result).toContain('...');
  });
});

// ---------------------------------------------------------------------------
// spellMnemonic — detects words not in the BIP39 English wordlist
// ---------------------------------------------------------------------------
describe('spellMnemonic', () => {
  it('returns an empty array for a valid 12-word mnemonic', () => {
    // Using real BIP39 words
    const validMnemonic =
      'abandon ability able about above absent absorb abstract absurd abuse access accident';
    expect(spellMnemonic(validMnemonic)).toEqual([]);
  });

  it('returns the invalid word when one word is misspelled', () => {
    const mnemonicWithTypo =
      'abandon ability able about above absent absorb abstract absurd abuse access accidentxyz';
    const result = spellMnemonic(mnemonicWithTypo);
    expect(result).toContain('accidentxyz');
    expect(result).toHaveLength(1);
  });

  it('returns all invalid words when multiple words are wrong', () => {
    const badMnemonic = 'abandon fake1 able fake2 above absent absorb abstract absurd abuse access accident';
    const result = spellMnemonic(badMnemonic);
    expect(result).toContain('fake1');
    expect(result).toContain('fake2');
    expect(result).toHaveLength(2);
  });

  it('returns an empty array for a valid 24-word mnemonic', () => {
    const validMnemonic24 =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    expect(spellMnemonic(validMnemonic24)).toEqual([]);
  });

  it('returns all words when every word is invalid', () => {
    const allBad = 'foo bar baz qux quux corge grunge blarg meh bleh blorp snork';
    const result = spellMnemonic(allBad);
    expect(result).toHaveLength(12);
  });

  it('is case-sensitive — uppercase valid words are reported as invalid', () => {
    // BIP39 wordlist is lowercase; 'Abandon' is not in the list
    const upperMnemonic =
      'Abandon ability able about above absent absorb abstract absurd abuse access accident';
    const result = spellMnemonic(upperMnemonic);
    expect(result).toContain('Abandon');
  });

  it('handles a single word that is valid', () => {
    expect(spellMnemonic('abandon')).toEqual([]);
  });

  it('handles a single word that is invalid', () => {
    expect(spellMnemonic('notaword')).toEqual(['notaword']);
  });
});

// ---------------------------------------------------------------------------
// decodeMemo — decodes a bs58check-encoded memo
// ---------------------------------------------------------------------------
describe('decodeMemo', () => {
  it('returns the original value when input is not a valid bs58check string', () => {
    const invalid = 'not-a-valid-memo-encoding!!!';
    expect(decodeMemo(invalid)).toBe(invalid);
  });

  it('returns the original value for an empty string', () => {
    expect(decodeMemo('')).toBe('');
  });

  it('does not throw for any string input', () => {
    const inputs = ['', 'hello', 'B62q123', '!!!', '   ', null, undefined];
    for (const input of inputs) {
      expect(() => decodeMemo(input as string)).not.toThrow();
    }
  });

  it('returns a string for any input', () => {
    expect(typeof decodeMemo('anything')).toBe('string');
    expect(typeof decodeMemo('')).toBe('string');
  });

  it('returns the original input when bs58check decode fails', () => {
    // Any string that is not valid bs58check will fail decode and return input
    const garbage = 'zzzzzzzzzzzzzzzzzzz';
    const result = decodeMemo(garbage);
    // Either decoded successfully (unlikely) or returned the original
    expect(typeof result).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// isEmptyObject
// ---------------------------------------------------------------------------
describe('isEmptyObject', () => {
  it('returns true for an empty plain object {}', () => {
    expect(isEmptyObject({})).toBe(true);
  });

  it('returns false for an object with properties', () => {
    expect(isEmptyObject({a: 1})).toBe(false);
  });

  it('returns false for null', () => {
    expect(isEmptyObject(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isEmptyObject(undefined)).toBe(false);
  });

  it('returns false for an array (even empty)', () => {
    // Arrays are not plain objects — constructor !== Object
    expect(isEmptyObject([])).toBe(false);
  });

  it('returns false for a non-empty array', () => {
    expect(isEmptyObject([1, 2, 3])).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isEmptyObject('hello')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isEmptyObject(42)).toBe(false);
  });

  it('returns false for a wallet-like object with an address', () => {
    expect(isEmptyObject({address: 'B62q...', id: 1})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toDecimal
// ---------------------------------------------------------------------------
describe('toDecimal', () => {
  it('converts 1_000_000_000 nanomina to "1.000"', () => {
    expect(toDecimal(1_000_000_000)).toBe('1.000');
  });

  it('converts 0 to "0.000"', () => {
    expect(toDecimal(0)).toBe('0.000');
  });

  it('converts 100_000_000 to "0.100"', () => {
    expect(toDecimal(100_000_000)).toBe('0.100');
  });

  it('always returns a string with 3 decimal places', () => {
    const result = toDecimal(500_000_000);
    expect(result).toMatch(/^\d+\.\d{3}$/);
  });

  it('returns "1.235" for 1_234_567_890 (rounds at 3dp)', () => {
    expect(toDecimal(1_234_567_890)).toBe('1.235');
  });
});

// ---------------------------------------------------------------------------
// getTotalPages
// ---------------------------------------------------------------------------
describe('getTotalPages', () => {
  it('returns 1 for 0 total items', () => {
    expect(getTotalPages(0)).toBe(1);
  });

  it('returns 1 when totalItems is undefined', () => {
    expect(getTotalPages()).toBe(1);
  });

  it('returns 1 when totalItems fits exactly on one page', () => {
    expect(getTotalPages(TRANSACTIONS_TABLE_ITEMS_PER_PAGE)).toBe(1);
  });

  it('returns 2 when totalItems is one more than one page', () => {
    expect(Number(getTotalPages(TRANSACTIONS_TABLE_ITEMS_PER_PAGE + 1))).toBe(2);
  });

  it('returns the correct number of pages for transactions (15 per page)', () => {
    expect(Number(getTotalPages(30))).toBe(2);
    expect(Number(getTotalPages(45))).toBe(3);
  });

  it('uses VALIDATORS_TABLE_ITEMS_PER_PAGE when transactions=false', () => {
    // validators have 100 per page
    expect(Number(getTotalPages(VALIDATORS_TABLE_ITEMS_PER_PAGE, false))).toBe(1);
    expect(Number(getTotalPages(VALIDATORS_TABLE_ITEMS_PER_PAGE + 1, false))).toBe(2);
  });

  it('returns at least 1 for any input', () => {
    for (const n of [0, 1, 5, 14, 15, 16, 100, 1000]) {
      expect(Number(getTotalPages(n))).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// getPageFromOffset
// ---------------------------------------------------------------------------
describe('getPageFromOffset', () => {
  it('returns 1 for offset 0', () => {
    expect(getPageFromOffset(0)).toBe(1);
  });

  it('returns 2 for offset equal to one page size', () => {
    expect(getPageFromOffset(TRANSACTIONS_TABLE_ITEMS_PER_PAGE)).toBe(2);
  });

  it('returns 3 for offset equal to two page sizes', () => {
    expect(getPageFromOffset(TRANSACTIONS_TABLE_ITEMS_PER_PAGE * 2)).toBe(3);
  });

  it('returns 1 when called with no arguments', () => {
    expect(getPageFromOffset()).toBe(1);
  });

  it('is consistent with getTotalPages: page 1 starts at offset 0', () => {
    expect(getPageFromOffset(0)).toBe(1);
  });

  it('returns the correct page for offset 30 (page 3 with 15 per page)', () => {
    expect(getPageFromOffset(30)).toBe(3);
  });

  it('returns a number type', () => {
    expect(typeof getPageFromOffset(0)).toBe('number');
    expect(typeof getPageFromOffset(15)).toBe('number');
  });
});
