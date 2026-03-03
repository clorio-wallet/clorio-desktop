import {atom} from 'recoil';

interface DeeplinkAtomProps {
  type?: string;
  data?: string;
}

export const deeplinkState = atom<DeeplinkAtomProps>({
  key: 'deeplinkAtom',
  default: {
    type: '',
    data: '',
  },
});
