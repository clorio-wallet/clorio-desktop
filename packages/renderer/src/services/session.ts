/**
 * session.ts
 *
 * Synchronous, sessionStorage-backed session store.
 * Replaces the nedb/nedb-promises Datastore used in db.ts.
 *
 * The session is scoped to the browser tab/window lifetime — it is cleared
 * automatically when the tab is closed, which is the correct security
 * behaviour for a wallet.
 */

const SESSION_KEY = 'clorio:session';
const PASSPHRASE_FLAG_KEY = 'clorio:passphrase_flag';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalletSession {
  address: string;
  id: number;
  ledger: boolean;
  ledgerAccount: number;
  mnemonic: boolean;
  accountNumber: number;
}

// ---------------------------------------------------------------------------
// Session CRUD
// ---------------------------------------------------------------------------

/**
 * Persists a wallet session to sessionStorage.
 * Any previously stored session is overwritten.
 */
export const storeSession = (data: WalletSession): void => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
};

/**
 * Reads the current wallet session.
 * Returns null when no session exists.
 */
export const readSession = (): WalletSession | null => {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as WalletSession) : null;
};

/**
 * Updates the address and id fields of an existing session,
 * leaving ledger / mnemonic / account data intact.
 * If no session exists the call is a no-op.
 */
export const updateUser = (address: string, id: number): void => {
  const current = readSession();
  if (!current) return;
  storeSession({ ...current, address, id });
};

/**
 * Removes the wallet session and the passphrase flag from sessionStorage.
 */
export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(PASSPHRASE_FLAG_KEY);
  // Keep legacy key clean too, in case old code wrote it
  sessionStorage.removeItem('PASSPHRASE');
};

// ---------------------------------------------------------------------------
// Passphrase flag
// ---------------------------------------------------------------------------

/**
 * Stores a boolean flag that indicates whether the user is logging in with a
 * mnemonic passphrase (true) or a plain private key (false).
 */
export const setPassphraseFlag = (isUsingMnemonic: boolean): void => {
  sessionStorage.setItem(PASSPHRASE_FLAG_KEY, JSON.stringify(isUsingMnemonic));
};

/**
 * Reads the passphrase flag stored by {@link setPassphraseFlag}.
 * Returns false when the flag has never been set.
 */
export const getPassphraseFlag = (): boolean => {
  const raw = sessionStorage.getItem(PASSPHRASE_FLAG_KEY);
  return raw !== null ? (JSON.parse(raw) as boolean) : false;
};
