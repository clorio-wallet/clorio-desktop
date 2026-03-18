import {atom} from 'recoil';

export interface DeeplinkData {
  to?: string;
  amount?: string | number;
  fee?: string | number;
  memo?: string;
  [key: string]: unknown;
}

export interface DeeplinkAtomProps {
  type?: string;
  data?: DeeplinkData;
}

export const deeplinkState = atom<DeeplinkAtomProps>({
  key: 'deeplinkAtom',
  default: {
    type: '',
    data: {},
  },
});
