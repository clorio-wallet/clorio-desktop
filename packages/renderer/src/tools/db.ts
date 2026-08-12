/**
 * db.ts
 *
 * Re-exports session helpers from services/session.ts (synchronous,
 * sessionStorage-backed) and keeps the localStorage account helpers.
 *
 * nedb / nedb-promises have been removed entirely. All session state that was
 * previously stored in an in-memory nedb Datastore is now stored in
 * sessionStorage so that it is automatically cleared when the tab/window is
 * closed — the correct security behaviour for a wallet.
 *
 * Call-site compatibility notes
 * ─────────────────────────────
 * • storeSession / readSession / clearSession / updateUser are now synchronous.
 *   Any callers that previously awaited them will continue to work because
 *   await on a non-Promise value is a no-op.
 * • setPassphrase(bool) → setPassphraseFlag(bool)  (re-exported under both
 *   names for a smooth transition; prefer the new name in new code).
 * • getPassphrase() used to return the raw boolean from nedb; it now delegates
 *   to getPassphraseFlag() and returns the same boolean (no longer async).
 * • storeNetworkData / readNetworkData were nedb-only and had no callers after
 *   B2; they are intentionally not re-implemented.
 * • findAll() had no callers and is removed.
 */

// ---------------------------------------------------------------------------
// Re-export the new session API (synchronous, sessionStorage-backed)
// ---------------------------------------------------------------------------

export {
  storeSession,
  readSession,
  clearSession,
  updateUser,
  setPassphraseFlag,
  getPassphraseFlag,
} from '../services/session';

// Legacy alias — keeps old call sites (`setPassphrase(bool)`) compiling.
export {setPassphraseFlag as setPassphrase} from '../services/session';

/**
 * Legacy alias for getPassphraseFlag.
 * Previously returned `undefined | { passphrase: boolean }` from nedb;
 * now returns `boolean` directly.  The only callers checked the truthiness
 * of the result and read `.passphrase`, so returning the boolean is a safe
 * simplification.
 */
export {getPassphraseFlag as getPassphrase} from '../services/session';

// ---------------------------------------------------------------------------
// localStorage account helpers (unchanged)
// ---------------------------------------------------------------------------

export const pushAccount = (account: {address: string; accountId: number}): void => {
  const storedData: {address: string; accountId: number}[] = JSON.parse(
    localStorage.getItem('walletAccounts') ?? '[]',
  );
  storedData.push(account);
  localStorage.setItem('walletAccounts', JSON.stringify(storedData));
};

export const storeAccounts = (accounts: {address: string; accountId: number}[]): void => {
  localStorage.setItem('walletAccounts', JSON.stringify(accounts));
};

export const getAllAccounts = (): {address: string; accountId: number}[] => {
  const storedData = localStorage.getItem('walletAccounts');
  return storedData ? (JSON.parse(storedData) as {address: string; accountId: number}[]) : [];
};

export const removeAccountById = (accountId: number): void => {
  const storedData: {address: string; accountId: number}[] = JSON.parse(
    localStorage.getItem('walletAccounts') ?? '[]',
  );
  const updated = storedData.filter(a => a.accountId !== accountId);
  localStorage.setItem('walletAccounts', JSON.stringify(updated));
};

export const removeAccountByAddress = (address: string): void => {
  const storedData: {address: string; accountId: number}[] = JSON.parse(
    localStorage.getItem('walletAccounts') ?? '[]',
  );
  const updated = storedData.filter(a => a.address !== address);
  localStorage.setItem('walletAccounts', JSON.stringify(updated));
};

export const getAccountById = (accountId: number): {address: string; accountId: number} | null => {
  const storedData: {address: string; accountId: number}[] = JSON.parse(
    localStorage.getItem('walletAccounts') ?? '[]',
  );
  return storedData.find(a => a.accountId === accountId) ?? null;
};

export const getAccountByAddress = (
  address: string,
): {address: string; accountId: number} | null => {
  const storedData: {address: string; accountId: number}[] = JSON.parse(
    localStorage.getItem('walletAccounts') ?? '[]',
  );
  return storedData.find(a => a.address === address) ?? null;
};

export const clearAllAccounts = (): void => {
  localStorage.removeItem('walletAccounts');
};
