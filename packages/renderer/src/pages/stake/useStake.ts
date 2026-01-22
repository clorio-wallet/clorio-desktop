import {useMutation, useQuery} from '@apollo/client';
import {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {useRecoilValue} from 'recoil';
import type {IValidatorData} from '/@/components/stake/stakeTableRow/ValidatorDataTypes';
import {BalanceContext} from '/@/contexts/balance/BalanceContext';
import {IBalanceContext} from '/@/contexts/balance/BalanceTypes';
import {
  BROADCAST_DELEGATION,
  GET_AVERAGE_FEE,
  GET_NONCE_AND_DELEGATE,
  GET_VALIDATORS,
  GET_VALIDATORS_NEWS,
} from '/@/graphql/query';
import {DeeplinkType} from '/@/hooks/useDeeplinkHandler';
import {deeplinkState, walletState} from '/@/store';
import {
  DEFAULT_QUERY_REFRESH_INTERVAL,
  MINIMUM_NONCE,
  VALIDATORS_TABLE_ITEMS_PER_PAGE,
  client,
  createDelegationPaymentInputFromPayload,
  createSignatureInputFromSignature,
  deriveAccount,
  feeOrDefault,
  getDefaultValidUntilField,
  getPassphrase,
} from '/@/tools';
import {
  createLedgerDelegationTransaction,
  isMinaAppOpen,
  signTransaction,
} from '/@/tools/ledger/ledger';
import {IKeypair} from '/@/types';
import {IFeeQuery} from '/@/types/Fee';
import {IValidatorsNewsQuery} from '/@/types/NewsData';
import {IWalletData} from '/@/types/WalletData';
import {checkBalance, initialDelegateData, ModalStates} from './StakeHelper';
import {INonceDelegateQueryResult} from './StakeTypes';

export const useStake = (sessionData: IWalletData) => {
  const [storedPassphrase, setStoredPassphrase] = useState<boolean>(false);
  const navigate = useNavigate();
  const [delegateData, setDelegate] = useState<IValidatorData>(initialDelegateData);
  const [currentDelegate, setCurrentDelegate] = useState<string>('');
  const [currentDelegateName, setCurrentDelegateName] = useState<string>('');
  const [showModal, setShowModal] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [customDelegate, setCustomDelegate] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [customNonce, setCustomNonce] = useState<number>(MINIMUM_NONCE);
  const [selectedFee, setSelectedFee] = useState<number>(0);
  const [ledgerTransactionData, setLedgerTransactionData] = useState<string>('');
  const [sendTransactionFlag, setSendTransactionFlag] = useState<boolean>(false);
  const {getBalance, setShouldBalanceUpdate} = useContext<Partial<IBalanceContext>>(BalanceContext);
  const {address, accountNumber, ledger: isLedgerEnabled} = useRecoilValue(walletState);

  const balance = getBalance && getBalance(address);
  const {
    data: validatorsData,
    error: validatorsError,
    loading: validatorsLoading,
  } = useQuery(GET_VALIDATORS, {variables: {offset}});
  const {data: feeData} = useQuery<IFeeQuery>(GET_AVERAGE_FEE);
  const {data: newsData} = useQuery<IValidatorsNewsQuery>(GET_VALIDATORS_NEWS);
  const deeplinkData = useRecoilValue(deeplinkState);
  const {
    data: nonceAndDelegateData,
    refetch: nonceAndDelegateRefetch,
    loading: nonceAndDelegateLoading,
    error: nonceAndDelegateError,
  } = useQuery<INonceDelegateQueryResult>(GET_NONCE_AND_DELEGATE, {
    variables: {publicKey: address},
    fetchPolicy: 'network-only',
    pollInterval: DEFAULT_QUERY_REFRESH_INTERVAL,
  });
  const latestNews =
    newsData && newsData?.newsValidators.length > 0 ? newsData?.newsValidators[0] : {};
  const [broadcastDelegation, broadcastResult] = useMutation(BROADCAST_DELEGATION, {
    onError: error => {
      toast.error(error.message);
      return clearState();
    },
  });

  useEffect(() => {
    getPassphrase().then(passphrase => {
      setStoredPassphrase(passphrase);
    });
  }, []);

  useEffect(() => {
    if (deeplinkData.type) {
      const {data, type} = deeplinkData as any;
      if (type === DeeplinkType.DELEGATION && !!data) {
        openCustomDelegateModal();
        setCustomDelegate(data.delegator);
      }
    }
  }, [deeplinkData]);

  useEffect(() => {
    if (nonceAndDelegateData?.accountByKey?.delegate?.publicKey) {
      setCurrentDelegate(nonceAndDelegateData?.accountByKey.delegate.publicKey);
      setCurrentDelegateName(nonceAndDelegateData.accountByKey.delegate.name);
    }
  }, [nonceAndDelegateData]);

  useEffect(() => {
    if (!nonceAndDelegateLoading && nonceAndDelegateError) {
      nonceAndDelegateRefetch();
    }
  }, [nonceAndDelegateLoading, nonceAndDelegateError]);

  useEffect(() => {
    if (isLedgerEnabled && !ledgerTransactionData) {
      if (showModal === ModalStates.PASSPHRASE) {
        const transactionListener = signLedgerDelegation();
        // @ts-ignore
        return transactionListener.unsubscribe;
      }
    }
  }, [ledgerTransactionData, showModal]);

  useEffect(() => {
    if (sendTransactionFlag && broadcastResult?.data) {
      clearState();
      if (setShouldBalanceUpdate) {
        setShouldBalanceUpdate(true);
      }
      nonceAndDelegateRefetch({publicKey: sessionData.address});
      toast.success('Delegation successfully broadcasted');
      navigate('/stake');
    }
    broadcastLedgerTransaction();
  }, [sendTransactionFlag, broadcastResult]);

  const broadcastLedgerTransaction = () => {
    try {
      if (ledgerTransactionData && !sendTransactionFlag) {
        const actualNonce = getNonce();
        const publicKey = delegateData?.publicKey;
        const SignatureInput = {rawSignature: ledgerTransactionData};
        const SendPaymentInput = {
          nonce: actualNonce.toString(),
          memo: '',
          fee: selectedFee.toString(),
          to: publicKey,
          from: address,
          validUntil: getDefaultValidUntilField(),
        };
        broadcastDelegation({
          variables: {input: SendPaymentInput, signature: SignatureInput},
        });
        setSendTransactionFlag(true);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openModal = (delegate: IValidatorData) => {
    setDelegate(delegate);
    setShowModal(ModalStates.CONFIRM_DELEGATION);
  };

  const openCustomDelegateModal = () => {
    setShowModal(ModalStates.CUSTOM_DELEGATION);
  };

  const closeModal = () => {
    setShowModal('');
    setCustomNonce(MINIMUM_NONCE);
    setCustomDelegate('');
  };

  const confirmDelegate = () => {
    try {
      if (!nonceAndDelegateData && !customNonce) {
        setShowModal(ModalStates.NONCE);
      } else if (customDelegate) {
        setShowModal(ModalStates.FEE);
        setDelegate({publicKey: customDelegate});
      } else {
        setShowModal(ModalStates.FEE);
      }
    } catch (e: any) {
      setShowModal(ModalStates.FEE);
    }
  };

  const confirmCustomDelegate = (delegate: string) => {
    try {
      nonceAndDelegateRefetch({publicKey: sessionData.address});
      setShowModal(ModalStates.FEE);
      setDelegate({publicKey: delegate});
    } catch (e: any) {
      setShowModal(ModalStates.FEE);
    }
  };

  const closeNonceModal = () => {
    setShowModal('');
    setCustomNonce(MINIMUM_NONCE);
  };

  const clearState = () => {
    setShowModal('');
    setDelegate(initialDelegateData);
    setSendTransactionFlag(false);
    setCustomNonce(MINIMUM_NONCE);
    setPrivateKey('');
    setCustomDelegate('');
    setLedgerTransactionData('');
    setSelectedFee(feeOrDefault());
  };

  const changeOffset = (page: number) => {
    const data = (page - 1) * VALIDATORS_TABLE_ITEMS_PER_PAGE;
    setOffset(data);
  };

  const setFee = (selectedFee: number) => {
    setSelectedFee(selectedFee);
    setShowModal(ModalStates.PASSPHRASE);
  };

  const signLedgerDelegation = async () => {
    try {
      if (!delegateData?.publicKey) {
        throw new Error('Recipient Public key is not defined');
      }
      checkBalance(selectedFee, balance);
      await isMinaAppOpen();
      const actualNonce = getNonce();
      const senderAccount = sessionData?.ledgerAccount || 0;
      const receiverAddress = delegateData?.publicKey;
      const transactionToSend = createLedgerDelegationTransaction({
        senderAccount,
        senderAddress: address,
        receiverAddress,
        fee: +selectedFee,
        nonce: actualNonce,
      });
      const signature = await signTransaction(transactionToSend);
      setShowModal(ModalStates.BROADCASTING);
      setLedgerTransactionData(signature.signature);
    } catch (e: any) {
      toast.error(e.message || 'An error occurred while loading hardware wallet');
      setShowModal('');
    }
  };

  const signDelegation = async (passphrase?: string) => {
    try {
      if (!delegateData?.publicKey) {
        throw new Error('The Public key of the selected delegate is missing');
      }
      checkBalance(selectedFee, balance);
      const actualNonce = getNonce();
      const derivedAccount = await deriveAccount(
        passphrase?.trim() || privateKey.trim(),
        accountNumber,
      );
      const keypair = {
        privateKey: derivedAccount.privateKey,
        publicKey: derivedAccount.publicKey,
      } as IKeypair;
      const stakeDelegation = {
        to: delegateData.publicKey,
        from: address || keypair.publicKey,
        fee: selectedFee,
        nonce: actualNonce,
      };
      const signedTransaction = (await client()).signStakeDelegation(
        stakeDelegation,
        keypair.privateKey,
      );

      await (await client()).verifyStakeDelegation(signedTransaction);

      if (signedTransaction) {
        const signatureInput = createSignatureInputFromSignature(signedTransaction.signature);
        const sendPaymentInput = createDelegationPaymentInputFromPayload(signedTransaction.data);
        broadcastDelegation({
          variables: {
            input: sendPaymentInput,
            signature: signatureInput,
          },
        });
        toast.info('Broadcasting delegation');
        setSendTransactionFlag(true);
        setShowModal('');
        setPrivateKey('');
      }
    } catch (e: any) {
      setPrivateKey('');
      toast.error(
        e.message || 'There was an error processing your delegation, please try again later.',
      );
    }
  };

  const getNonce = () => {
    if (nonceAndDelegateData?.accountByKey?.usableNonce) {
      return nonceAndDelegateData.accountByKey.usableNonce;
    }
    if (nonceAndDelegateData?.accountByKey?.usableNonce === 0) {
      return 0;
    }
    return customNonce;
  };

  return {
    address,
    changeOffset,
    closeModal,
    closeNonceModal,
    confirmCustomDelegate,
    confirmDelegate,
    currentDelegate,
    currentDelegateName,
    customDelegate,
    customNonce,
    delegateData,
    feeData,
    isLedgerEnabled,
    latestNews,
    nonceAndDelegateLoading,
    offset,
    openCustomDelegateModal,
    openModal,
    setCustomNonce,
    setFee,
    setPrivateKey,
    showModal,
    signDelegation,
    storedPassphrase,
    validatorsData,
    validatorsError,
    validatorsLoading,
  };
};
