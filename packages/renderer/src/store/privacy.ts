import {atom} from 'recoil';
import {loadState, saveState} from './localStorage';

export interface IPrivacyMode {
  active: boolean;
  fields: IOPTIONS[];
}

export const OPTIONS = ['Balance', 'Transactions', 'Address', 'Delegate'] as const;

export enum IOPTIONS {
  Balance = 'balance',
  Transactions = 'transactions',
  Address = 'address',
  Delegate = 'delegate',
}

const PERSISTENCE_KEY = 'privacyModeState';

export const privacyModeState = atom<IPrivacyMode>({
  key: PERSISTENCE_KEY,
  default: {
    active: false,
    fields: [IOPTIONS.Balance],
  },
  effects_UNSTABLE: [
    ({setSelf, onSet}) => {
      const savedState = loadState(PERSISTENCE_KEY);
      if (savedState !== undefined) {
        setSelf(savedState);
      }

      onSet(newState => {
        saveState(PERSISTENCE_KEY, newState);
      });
    },
  ],
});
