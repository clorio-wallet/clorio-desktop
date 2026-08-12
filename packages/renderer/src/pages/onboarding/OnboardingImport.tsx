import {useNavigate} from 'react-router-dom';
import {useState, useEffect, useCallback, useRef} from 'react';
import {useLazyQuery} from '@apollo/client';
import {toast} from 'react-toastify';
import {ArrowLeft, ArrowRight} from 'react-feather';
import {deriveAccount, setPassphrase, spellMnemonic, storeAccounts, storeSession} from '/@/tools';
import {GET_ID} from '/@/graphql/query';
import Button from '../../components/UI/Button';
import type {IWalletIdData} from '/@/types/WalletIdData';
import SecureDataStorageComponent from '../../components/ReadSecureStorage';
import useSecureStorage from '../../hooks/useSecureStorage';
import {useSetRecoilState} from 'recoil';
import {configState, walletState} from '../../store';
import {isElectron} from '../../tools/environment';
import OnboardingLayout from './OnboardingLayout';

interface IProps {
  toggleLoader: (state: boolean) => void;
}

const WORD_COUNT = 12;
const COLS = 3;

export default function OnboardingImport({toggleLoader}: IProps) {
  const [words, setWords] = useState<string[]>(Array(WORD_COUNT).fill(''));
  const [storePassphrase, setStorePassphrase] = useState<boolean>(isElectron());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passphraseError, setPassphraseError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const [userIdFetch, {data: userIdData, error: userIdError, loading: userIdLoading}] =
    useLazyQuery<IWalletIdData>(GET_ID, {variables: {publicKey}});
  const {encryptData} = useSecureStorage();
  const setConfig = useSetRecoilState(configState);
  const updateWallet = useSetRecoilState(walletState);

  // Derive the joined mnemonic string from individual words
  const mnemonic = words.join(' ').trim();

  // Reset on unmount
  useEffect(() => {
    return () => {
      setWords(Array(WORD_COUNT).fill(''));
      setPublicKey('');
    };
  }, []);

  // ── Enter key submits ──────────────────────────────────────
  useEffect(() => {
    const listener = async (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        await checkCredentials();
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [mnemonic]);

  // Ctrl/Cmd+U skip-checks shortcut
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        checkCredentials(true);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [mnemonic]);

  useEffect(() => {
    if (userIdError) {
      if (storePassphrase) {
        setShowPasswordModal(true);
      } else {
        toggleLoader(true);
        storeSessionAndRedirect(publicKey, -1);
      }
    }
  }, [userIdError]);

  // ── Word input handlers ────────────────────────────────────
  const updateWord = (index: number, raw: string) => {
    const wordList = raw.trim().split(/\s+/);

    // Paste handling: if user pastes multiple words, fill from index
    if (wordList.length > 1) {
      const next = [...words];
      wordList.slice(0, WORD_COUNT - index).forEach((w, i) => {
        next[index + i] = w;
      });
      setWords(next);
      // Focus last filled
      const lastIdx = Math.min(index + wordList.length, WORD_COUNT - 1);
      inputRefs.current[lastIdx]?.focus();
      debouncedVerify(next.join(' '));
      return;
    }

    const next = [...words];
    next[index] = raw.toLowerCase();
    setWords(next);
    debouncedVerify(next.join(' '));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Space' || e.code === 'Tab') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, WORD_COUNT - 1);
      inputRefs.current[nextIndex]?.focus();
    }
    if (e.code === 'Backspace' && words[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Spell check ────────────────────────────────────────────
  const verifyMnemonicSpell = useCallback((m: string) => {
    const parts = m.trim().split(' ').filter(Boolean);
    if (parts.length >= 3) {
      const errs = spellMnemonic(m);
      if (errs.length > 0) {
        setPassphraseError(`Misspelled: ${errs.join(', ')}`);
      } else {
        setPassphraseError(null);
      }
    } else {
      setPassphraseError(null);
    }
  }, []);

  const debounce = (fn: (...a: any[]) => void, ms: number) => {
    let t: NodeJS.Timeout;
    return (...a: any[]) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  const debouncedVerify = useCallback(debounce(verifyMnemonicSpell, 300), []);

  // ── Session helpers ────────────────────────────────────────
  const saveAndStoreSession = (userId?: string | number, derivedPublicKey?: string) => {
    if (publicKey && publicKey !== '' && !userIdLoading && userIdData) {
      toggleLoader(true);
      storeSessionAndRedirect(derivedPublicKey || publicKey, +userIdData.idByPublicKey.id || -1);
    } else if (derivedPublicKey) {
      toggleLoader(true);
      storeSessionAndRedirect(derivedPublicKey, +(userId ?? -1));
    }
  };

  const storeSessionAndRedirect = async (pk: string, id: number) => {
    await userIdFetch({variables: {publicKey: pk}});
    const isUsingMnemonic = mnemonic.split(' ').length === 12 || mnemonic.split(' ').length === 24;
    setPassphrase(isUsingMnemonic);
    await storeSession({
      address: pk,
      id,
      ledger: false,
      ledgerAccount: 0,
      mnemonic: isUsingMnemonic,
      accountNumber: 0,
    });
    await updateWallet({
      address: pk,
      id,
      ledger: false,
      ledgerAccount: 0,
      mnemonic: isUsingMnemonic,
      accountNumber: 0,
      isAuthenticated: true,
    });
    await storeAccounts([{accountId: 0, address: pk}]);
    setConfig(prev => ({
      ...prev,
      isAuthenticated: true,
      isUsingMnemonic,
      isLedgerEnabled: false,
      isLocked: false,
    }));
    navigate('/overview');
    toggleLoader(false);
  };

  const checkCredentials = async (skipChecks?: boolean) => {
    try {
      const derived = await deriveAccount(mnemonic, undefined, skipChecks);
      if (derived.publicKey) {
        setPublicKey(derived.publicKey);
        const {data} = await userIdFetch({variables: {publicKey: derived.publicKey}});
        if (storePassphrase) {
          setShowPasswordModal(true);
        } else {
          saveAndStoreSession(data?.idByPublicKey?.id, derived.publicKey);
        }
      }
    } catch {
      if (navigator.onLine) {
        toast.error('Private key not valid, please try again.');
      } else {
        setShowPasswordModal(true);
        toast.warning('You are currently offline.');
      }
    }
  };

  const onSecureStorageSubmit = (key: string) => {
    encryptData({key, data: mnemonic});
    if (userIdData) {
      saveAndStoreSession();
    } else {
      toggleLoader(true);
      storeSessionAndRedirect(publicKey, -1);
    }
    setShowPasswordModal(false);
    setConfig(old => ({...old, isUsingPassword: true}));
  };

  const storePassphraseHandler = () => setStorePassphrase(current => !current);

  // ── helpers ─────────────────────────────────────────────────────────────
  const filledWords = words.filter(Boolean).length;
  const isComplete = filledWords === WORD_COUNT && !passphraseError;

  // Build rows for the grid
  const rows: number[][] = [];
  for (let i = 0; i < WORD_COUNT; i += COLS) {
    rows.push([i, i + 1, i + 2].filter(n => n < WORD_COUNT));
  }

  return (
    <OnboardingLayout step={{current: 1, total: 2}}>
      <div className="oi-page">
        {/* ── Header ── */}
        <div className="oi-header">
          <h1 className="oi-title">Secret Recovery Phrase</h1>
          <p className="oi-description">
            Enter your 12-word recovery phrase to restore access to your wallet.
          </p>
        </div>

        {/* ── Word grid ── */}
        <div className="oi-grid">
          {rows.map(row =>
            row.map(idx => (
              <div
                key={idx}
                className="oi-word-cell"
              >
                <span className="oi-word-index">{String(idx + 1).padStart(2, '0')}</span>
                <input
                  ref={el => {
                    inputRefs.current[idx] = el;
                  }}
                  id={`oi-word-${idx}`}
                  className={`oi-word-input${words[idx] ? ' oi-word-input--filled' : ''}${
                    passphraseError && words[idx] ? ' oi-word-input--error' : ''
                  }`}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={words[idx]}
                  placeholder=""
                  onChange={e => updateWord(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  onPaste={e => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text');
                    updateWord(idx, text);
                  }}
                />
              </div>
            )),
          )}
        </div>

        {passphraseError && <div className="oi-error">{passphraseError}</div>}

        {/* ── Security banner ── */}
        <div className="oi-security-banner">
          <svg
            className="oi-security-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 2L3 6.5V11C3 15.55 6.84 19.74 12 21C17.16 19.74 21 15.55 21 11V6.5L12 2Z"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M9 12L11 14L15 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="oi-security-text">
            <strong>SECURITY PROTOCOL</strong>
            <p>
              Never share these words with anyone. Store them offline in a secure place. Clorio
              support will never ask for your recovery phrase.
            </p>
          </div>
        </div>

        {/* ── Footer row ── */}
        <div className="oi-footer-row w-full mt-4 pt-4">
          <label
            className="oi-confirm-label cursor-pointer"
            htmlFor="storePassphrase"
          >
            <input
              type="checkbox"
              id="storePassphrase"
              name="storePassphrase"
              className="oi-checkbox"
              checked={storePassphrase}
              onChange={storePassphraseHandler}
              disabled={!isElectron()}
            />
            <span>Store the passphrase encrypted on this device</span>
          </label>
        </div>
        <div className="oi-actions oi-actions--wide mt-3 sm:mt-0">
          <Button
            text="Back"
            icon={<ArrowLeft />}
            link="/login-selection"
            style="quiet"
            disableHoverStyle
          />
          <Button
            onClick={checkCredentials}
            text="Continue"
            style="primary"
            icon={<ArrowRight />}
            appendIcon
            disabled={!isComplete}
          />
        </div>
      </div>

      <SecureDataStorageComponent
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={onSecureStorageSubmit}
      />
    </OnboardingLayout>
  );
}
