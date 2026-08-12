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
  // Keep the legacy passphrase flag synchronized with the session mnemonic state.
  sessionStorage.setItem(PASSPHRASE_FLAG_KEY, JSON.stringify(data.mnemonic));
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
 * Removes the wallet session and any legacy passphrase flag from sessionStorage.
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
 * Updates the mnemonic flag on the current session.
 * Falls back to the legacy standalone flag when no session exists yet.
 */
export const setPassphraseFlag = (isUsingMnemonic: boolean): void => {
  const current = readSession();
  if (current) {
    storeSession({...current, mnemonic: isUsingMnemonic});
    return;
  }

  sessionStorage.setItem(PASSPHRASE_FLAG_KEY, JSON.stringify(isUsingMnemonic));
};

/**
 * Reads the mnemonic flag from the current session.
 * Falls back to the legacy standalone flag for compatibility.
 */
export const getPassphraseFlag = (): boolean => {
  const current = readSession();
  if (current) {
    return current.mnemonic;
  }

  const raw = sessionStorage.getItem(PASSPHRASE_FLAG_KEY);
  return raw !== null ? (JSON.parse(raw) as boolean) : false;
};
