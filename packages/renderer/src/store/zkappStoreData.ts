import {atom} from 'recoil';

export const zkappStoreDataInitialState = {
  showZkappDetails: false,
  zkappDetails: {},
};

export const zkappStoreDataState = atom({
  key: 'zkappStoreData',
  default: zkappStoreDataInitialState,
});
