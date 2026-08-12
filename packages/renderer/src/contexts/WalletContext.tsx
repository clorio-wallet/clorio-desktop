/**
 * WalletContext
 *
 * Thin wrapper over the `walletState` Recoil atom.
 *
 * Previously this context maintained its own local React state that duplicated
 * `walletState`, causing the two to diverge. Now `useWallet()` reads and writes
 * the single Recoil atom directly, so there is only one source of truth.
 *
 * `WalletProvider` is kept as a no-op passthrough so that all existing call
 * sites that wrap children in `<WalletProvider>` continue to compile and work
 * without any changes. It no longer needs to be present in the tree for
 * `useWallet()` to function — Recoil's `RecoilRoot` (already in App.tsx) is
 * the only required ancestor.
 */
import {ReactNode} from 'react';
import {useRecoilState} from 'recoil';
import {walletState, initialWalletState} from '../store/wallet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IWalletContext {
  wallet: typeof initialWalletState;
  updateWallet: (newWallet: Partial<typeof initialWalletState> | Record<string, never>) => void;
}

// ---------------------------------------------------------------------------
// Provider — no-op passthrough; state lives in Recoil
// ---------------------------------------------------------------------------

export const WalletProvider = ({children}: {children: ReactNode}) => {
  return <>{children}</>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useWallet = (): IWalletContext => {
  const [wallet, setWallet] = useRecoilState(walletState);

  const updateWallet = (newWallet: Partial<typeof initialWalletState> | Record<string, never>) => {
    if (!newWallet || Object.keys(newWallet).length === 0) {
      // Called with {} (e.g. lockSession) — reset to initial state
      setWallet(initialWalletState);
    } else {
      setWallet(prev => ({...prev, ...(newWallet as Partial<typeof initialWalletState>)}));
    }
  };

  return {wallet, updateWallet};
};
