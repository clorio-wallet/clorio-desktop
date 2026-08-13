import {useRecoilState, useRecoilValue} from 'recoil';
import {configState, walletState, zkappState} from '../../../../store';
import {zkappInitialState} from '../../../../store/zkapp';
import {useContext, useEffect, useState} from 'react';
import Button from '../../Button';
import {getAccountAddress, sendResponse} from '../../../../tools/mina-zkapp-bridge';
import {useLazyQuery, useMutation} from '@apollo/client';
import {INonceQueryResult} from '../../../../pages/sendTX/SendTXHelper';
import {BROADCAST_TRANSACTION, GET_NONCE} from '../../../../graphql/query';
import {signTransaction} from '../../../../tools/utils';
import PasswordDecrypt from '../../../PasswordDecrypt';
import {toast} from 'react-toastify';
import {mnemonicToPrivateKey} from '../../../../../../preload/src/bip';
import {
  client,
  createPaymentInputFromPayload,
  createSignatureInputFromSignature,
  toNanoMINA,
} from '/@/tools';
import {ERROR_CODES} from '/@/tools/zkapp';
import ConfirmZkappLedger from './ConfirmZkappLedger';
import TransactionData from './TransactionData';
import {IBalanceContext} from '/@/contexts/balance/BalanceTypes';
import {BalanceContext} from '/@/contexts/balance/BalanceContext';
import Big from 'big.js';
import {Send} from 'react-feather';
import {ZkappModal, ZkappModalActions} from './ZkappModal';

export default function ConfirmZkappPayment() {
  const wallet = useRecoilValue(walletState);
  const {isLedgerEnabled} = useRecoilValue(configState);
  const [showPassword, setShowPassword] = useState(false);
  const [fetchNonce, {error: nonceError}] =
    useLazyQuery<INonceQueryResult>(GET_NONCE);
  const [{transactionData, showPaymentConfirmation}, setZkappState] = useRecoilState(zkappState);
  const {getBalance} = useContext<Partial<IBalanceContext>>(BalanceContext);

  const [broadcastTransaction] = useMutation(BROADCAST_TRANSACTION, {
    onError: error => {
      setTimeout(() => {
        toast.error(error.message);
        onClose();
      }, 1000);
    },
  });

  useEffect(() => {
    fetchAndSetNonce();
  }, [showPaymentConfirmation]);

  const fetchAndSetNonce = async () => {
    if (showPaymentConfirmation) {
      const {data: nonceData} = await fetchNonce({variables: {publicKey: wallet.address}});
      if (nonceData?.accountByKey?.usableNonce || nonceData?.accountByKey?.usableNonce === 0) {
        setZkappState(state => ({
          ...state,
          transactionData: {
            ...state.transactionData,
            nonce: nonceData.accountByKey.usableNonce,
          },
        }));
      }
    }
  };

  const onClose = () => {
    setZkappState(zkappInitialState);
    setShowPassword(false);
    sendResponse('clorio-error', ERROR_CODES.userRejectedRequest);
  };

  // Check with BigJs if the balance is enough
  const checkBalance = (fee: number | string) => {
    if (getBalance) {
      const address = getAccountAddress();
      const balance = getBalance(address[0]);
      const available = +(balance?.liquidUnconfirmed || 0);
      if (+available > 0 && +Big(available).sub(fee) >= 0) {
        return true;
      }
    }
    return false;
  };

  // TODO: Fix amount and fee
  const onConfirm = async (password: string) => {
    let privateKey = password;
    const address = getAccountAddress();
    if (password.trim().split(' ').length > 2) {
      privateKey = (await mnemonicToPrivateKey(password, wallet.accountNumber)) || password;
    }
    if (nonceError) {
      console.error('Error in send-payment:', nonceError);
      sendResponse('error', {error: nonceError});
      return;
    }
    const signedTx = await signTransaction(privateKey, {
      ...transactionData,
      from: address[0],
      amount: toNanoMINA(transactionData.amount),
      fee: toNanoMINA(transactionData.fee),
    });
    completePayment(signedTx);
  };

  const completePayment = async (signedTx: unknown) => {
    if (isLedgerEnabled) {
      // TODO: Implement ledger hash from BE
      sendResponse('clorio-signed-payment', {hash: ''});
    } else {
      const hashedTx = await (await client()).hashPayment(signedTx);
      sendResponse('clorio-signed-payment', {hash: hashedTx});
    }
    toast.success('Transaction signed successfully, waiting for broadcast.');
    setZkappState(state => ({
      ...state,
      ...zkappInitialState,
      isPendingConfirmation: true,
    }));
    setShowPassword(false);
    broadcastPayment(signedTx);
  };

  const broadcastPayment = async (signedTx: unknown) => {
    let signatureInput;
    if (isLedgerEnabled) {
      signatureInput = {rawSignature: signedTx.rawSignature};
    } else {
      signatureInput = createSignatureInputFromSignature(signedTx.signature);
    }
    const paymentInput = createPaymentInputFromPayload(signedTx.data);
    await broadcastTransaction({
      variables: {input: paymentInput, signature: signatureInput},
    });
  };

  const onSign = async () => {
    // Define the required balance
    const {fee} = transactionData;
    // Check if the current balance is sufficient
    if (checkBalance(toNanoMINA(fee))) {
      // If the balance is sufficient, change the state
      setShowPassword(true);
    } else {
      // If the balance is not sufficient, show an error message or handle it as per your requirement
      toast.error('Insufficient balance');
      console.error('Insufficient balance');
    }
  };

  const onFeeEdit = (fee: number) => {
    setZkappState(state => ({
      ...state,
      transactionData: {
        ...state.transactionData,
        fee,
      },
    }));
  };

  const onNonceEdit = (nonce: number) => {
    setZkappState(state => ({
      ...state,
      transactionData: {
        ...state.transactionData,
        nonce,
      },
    }));
  };

  const modalTitle = showPassword
    ? isLedgerEnabled
      ? 'Signing transaction'
      : 'Enter your password'
    : 'Confirm transaction';

  return (
    <ZkappModal
      show={showPaymentConfirmation}
      close={onClose}
      title={modalTitle}
      subtitle="Review the payment details and fees before signing."
      icon={<Send size={20} />}
      wide
    >
      {showPassword ? (
        isLedgerEnabled ? (
          <ConfirmZkappLedger
            onClose={() => setShowPassword(false)}
            onSuccess={completePayment}
          />
        ) : (
          <PasswordDecrypt
            onClose={() => setShowPassword(false)}
            onSuccess={onConfirm}
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          <TransactionData
            transactionData={transactionData}
            onFeeEdit={onFeeEdit}
            onNonceEdit={onNonceEdit}
          />
          <ZkappModalActions>
            <Button text="Cancel" variant="outlined" onClick={onClose} />
            <Button text="Continue" style="primary" onClick={onSign} />
          </ZkappModalActions>
        </div>
      )}
    </ZkappModal>
  );
}
