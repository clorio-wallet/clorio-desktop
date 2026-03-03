/** All known network type identifiers */
export const NET_CONFIG_TYPE = {
  Mainnet: 'mainnet',
  Devnet: 'devnet',
  Unknown: 'unknown',
};

/** unknown net config */
export const BASE_unknown_config = {
  netType: NET_CONFIG_TYPE.Unknown,
};

export interface NetConfigResult {
  netType: string;
  name: string;
}

/**
 * Returns the current network config derived from persisted network settings.
 * Falls back to the environment variable, then to Mainnet.
 */
export function getCurrentNetConfig(): NetConfigResult {
  try {
    const saved = localStorage.getItem('networkSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      const netType: string = settings.network ?? settings.label ?? NET_CONFIG_TYPE.Unknown;
      return {
        netType,
        name: settings.name ?? netType,
      };
    }
  } catch {
    // localStorage unavailable or JSON malformed — fall through to default
  }
  const envNetwork = import.meta.env.VITE_REACT_APP_NETWORK as string | undefined;
  return {
    netType: envNetwork ?? NET_CONFIG_TYPE.Mainnet,
    name: envNetwork ?? 'Mainnet',
  };
}

/** Networks that do not support staking */
export const NET_CONFIG_NOT_SUPPORT_STAKING: string[] = [NET_CONFIG_TYPE.Unknown];

export const ERROR_CODES = {
  userRejectedRequest: {code: 1002, message: 'User rejected the request.'},
  userDisconnect: {code: 1001, message: 'User disconnect, please connect first.'},
  noWallet: {code: 20001, message: 'Please create or restore wallet first.'},
  verifyFailed: {code: 20002, message: 'Verify failed.'},
  invalidParams: {code: 20003, message: 'Invalid method parameter(s).'},
  notSupportChain: {code: 20004, message: 'Not support chain.'},
  zkChainPending: {code: 20005, message: 'Request already pending. Please wait.'},
  unsupportMethod: {code: 20006, message: 'Method not supported.'},
  internal: {code: 21001, message: 'Transaction error.'},
  throwError: {code: 22001, message: 'Unspecified error message. This is a bug, please report it.'},
  originDismatch: {code: 23001, message: 'Origin dismatch.'},
  notFound: {code: 404, message: 'Resource not found'},
};
