/**
 * Environment helpers — no external dependencies.
 *
 * Replaces the `is-electron` package with a simple inline check that works
 * both in the main renderer process and in any web-only build.
 */

/**
 * Returns true when the renderer is running inside an Electron host.
 * The check mirrors what `is-electron` does internally.
 */
export const isElectron = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  // Electron sets a distinctive string in the user-agent
  if (navigator.userAgent.toLowerCase().includes('electron')) {
    return true;
  }
  // Belt-and-suspenders: Electron exposes process.type in the renderer
  if (
    typeof (window as Window & {process?: {type?: string}}).process?.type === 'string'
  ) {
    return true;
  }
  return false;
};

/**
 * Returns true when the app is configured to run against a devnet node.
 */
export const isDevnet = (): boolean =>
  import.meta.env.VITE_REACT_APP_NETWORK === 'devnet';
