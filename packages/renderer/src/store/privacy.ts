import {atom} from 'recoil';

export interface IPrivacyMode {
  active: boolean;
  fields: string[];
}

export const privacyModeState = atom<IPrivacyMode>({
  key: 'privacyModeState',
  default: {
    active: false,
    fields: ['balance'],
  },
});
