import {atom} from 'recoil';

export interface CredentialApprovalRequest {
  credential: unknown;
  source: string;
}

export const credentialApprovalState = atom<{
  show: boolean;
  request: CredentialApprovalRequest | null;
}>({
  key: 'credentialApprovalState',
  default: {
    show: false,
    request: null,
  },
});
