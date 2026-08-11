import {atom} from 'recoil';

export const zkappInitialState = {
  isPendingConfirmation: false,
  txType: null,
  showTransactionConfirmation: false,
  showPaymentConfirmation: false,
  showDelegationConfirmation: false,
  transactionData: {
    from: '',
    to: '',
    amount: '',
    fee: '',
    nonce: '',
    memo: '',
  },
  showMessageSign: false,
  messageToSign: '',
  isJsonMessageToSign: false,
  isNullifier: false,
  isFields: false,
  isZkappCommand: false,
  showPresentationApproval: false,
  presentationRequest: null as null | {
    request: unknown;
    source: string;
  },
};

export const zkappState = atom({
  key: 'zkapp',
  default: zkappInitialState,
});
