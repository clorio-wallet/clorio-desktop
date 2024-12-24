/// <reference types="vite/client" />

/**
 * Describes all existing environment variables and their types.
 * Required for Code completion/intellisense and type checking.
 *
 * Note: To prevent accidentally leaking env variables to the client, only variables prefixed with `VITE_` are exposed to your Vite-processed code.
 *
 * @see https://github.com/vitejs/vite/blob/0a699856b248116632c1ac18515c0a5c7cf3d1db/packages/vite/types/importMeta.d.ts#L7-L14 Base Interface.
 * @see https://vitejs.dev/guide/env-and-mode.html#env-files Vite Env Variables Doc.
 */
interface ImportMetaEnv {
  /**
   * URL where `renderer` web page is running.
   * This variable is initialized in scripts/watch.ts
   */
  readonly VITE_DEV_SERVER_URL: undefined | string;
  readonly VITE_REACT_APP_GQL_SERVER: undefined | string;
  readonly VITE_REACT_APP_NETWORK: undefined | string;
  readonly VITE_REACT_APP_EPOCH_URL: undefined | string;
  readonly VITE_REACT_APP_EXPLORER_URL: undefined | string;
  readonly VITE_REACT_APP_NETWORK_LIST: undefined | string;

  /** Current app version */
  readonly VITE_APP_VERSION: string;
  readonly VITE_GITHUB_OWNER: undefined | string;
  readonly VITE_GITHUB_REPO: undefined | string;
  readonly VITE_GITHUB_TOKEN: undefined | string;
  readonly VITE_REACT_APP_GITHUB_RELEASE_URL: undefined | string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
