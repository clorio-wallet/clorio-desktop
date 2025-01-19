import {useRecoilValue, useSetRecoilState, useRecoilState} from 'recoil';
import {DEFAULT_FEE, client, toNanoMINA} from '../tools';
import {NetConfig, sendResponse} from '../tools/mina-zkapp-bridge';
import {
  configState,
  connectZkappState,
  connectedSitesState,
  networkState,
  walletState,
  zkappState,
} from '../store';
import {toast} from 'react-toastify';
import {useEffect, useRef, useState} from 'react';
import SignMessage from './UI/modals/zkAppIntegration/SignMessage';
import ConfirmZkappPayment from './UI/modals/zkAppIntegration/ConfirmZkappPayment';
import ConfirmZkappDelegation from './UI/modals/zkAppIntegration/ConfirmZkappDelegation';
import ChangeNetwork from './UI/modals/zkAppIntegration/ChangeNetwork';
import AddChain from './UI/modals/zkAppIntegration/AddChain';
import ConfirmZkappTransaction from './UI/modals/zkAppIntegration/ConfirmZkappTransaction';
import {ERROR_CODES} from '../tools/zkapp';
import ConnectZkapp from './UI/modals/zkAppIntegration/ConnectZkapp';
import QRCodeGenerator from './QRCode/QRCodeGenerator';

export default function ZkappIntegration() {
  const wallet = useRecoilValue(walletState);
  const {sites} = useRecoilValue(connectedSitesState);
  const updateConnectZkapp = useSetRecoilState(connectZkappState);
  const {address: sender} = wallet;
  const setZkappState = useSetRecoilState(zkappState);
  const config = useRecoilValue(configState);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const qrCodeRef = useRef<{open: () => void}>(null);

  const [{availableNetworks, selectedNetwork, selectedNode}, setNetworkState] =
    useRecoilState(networkState);

  useEffect(() => {
    setListeners();
    return () => {
      console.log('Removing event listeners');
      window.ipcBridge.off('clorio-event');
    };
  }, []);

  useEffect(() => {
    setListeners();
  }, [config, wallet, sites]);

  const setListeners = () => {
    window.ipcBridge.on('clorio-event', async (event, payload) => { 
      const {type, data, source, title} = payload;
      if (!checkSource(source)) {
        if (type === 'clorio-get-network-config') {
          getNetworkConfig();
          return;
        }
        if (type === 'clorio-get-accounts') {
          sendResponse('clorio-set-accounts', []);
          return;
        }
        sendResponse('focus-clorio');
        updateConnectZkapp(prev => ({
          ...prev,
          showConnectZkapp: true,
          source,
          title,
        }));
        return;
      }

      switch (type) {
        case 'clorio-get-network-config':
          await getNetworkConfig();
          break;

        case 'clorio-get-accounts':
          getAccounts(source);
          break;

        case 'clorio-get-address':
          await getAddress(source, title);
          break;

        case 'clorio-sign-tx':
          signTx(data);
          break;

        case 'clorio-sign-message':
          await signMessage(data.message);
          break;

        case 'clorio-send-payment':
          await sendPayment(data);
          break;

        case 'clorio-add-chain':
          addChain(data);
          break;

        case 'clorio-switch-chain':
          await switchChain(data);
          break;

        case 'clorio-verify-message':
          await verifyMessage(data);
          break;

        case 'clorio-sign-json-message':
          await signJsonMessage(data);
          break;

        case 'clorio-verify-json-message':
          await verifyJsonMessage(data);
          break;

        case 'clorio-create-nullifier':
          await createNullifier(data);
          break;

        case 'clorio-stake-delegation':
          await stakeDelegation(data);
          break;

        case 'clorio-sign-fields':
          await signFields(data);
          break;

        case 'clorio-verify-fields':
          await verifyFields(data);
          break;

        case 'clorio-share-url':
          await shareUrl(data);
          break;

        default:
          console.error('Unknown event type:', type);
      }
    });
  };

  const checkSource = (source: string) =>
    source && sites.filter(({source: savedSite}) => savedSite === source).length > 0;

  const rejectIfLedger = () => {
    if (config.isLedgerEnabled) {
      sendResponse('clorio-error', ERROR_CODES.unsupportMethod);
      sendResponse('focus-clorio');
      toast.error('Ledger does not support this method.');
      throw new Error('Ledger is not supported');
    }
  };

  const getNetworkConfig = async () => {
    console.log('Received get-network-config');
    const netConfig: NetConfig = {
      chainId: selectedNode?.label,
      name: selectedNetwork?.name,
      networkID: selectedNetwork?.networkID,
    } as NetConfig;
    sendResponse('clorio-set-network-config', netConfig);
  };

  const getAddress = async (source: string, title: string) => {
    console.log('Received get-address');
    if (!config.isAuthenticated) {
      sendResponse('focus-clorio');
      toast.error('Please log into your wallet first.');
      return;
    } else if (checkSource(source)) {
      unlockWallet();
      sendResponse('clorio-set-address', [sender]);
    } else {
      sendResponse('focus-clorio');
      updateConnectZkapp(prev => ({
        ...prev,
        showConnectZkapp: true,
        source,
        title,
      }));
    }
  };

  // TODO: Implement getAccounts UI
  const getAccounts = (source: string) => {
    console.log('Received get-accounts');
    if (checkSource(source)) {
      unlockWallet();
      sendResponse('clorio-set-accounts', [sender]);
    } else {
      sendResponse('clorio-set-accounts', []);
    }
  };

  const signMessage = async (data: string) => {
    rejectIfLedger();
    sendResponse('focus-clorio');
    console.log('Received sign-message-browser');
    setZkappState(prev => ({
      ...prev,
      showMessageSign: true,
      messageToSign: data,
      isJsonMessageToSign: false,
      isNullifier: false,
    }));
  };

  const sendPayment = async (data: any) => {
    if (!config.isAuthenticated) {
      sendResponse('focus-clorio');
      toast.error('Please log into your wallet first.');
      return;
    }
    try {
      if (
        !data.to ||
        typeof data.to !== 'string' ||
        !data.amount ||
        (typeof data.amount !== 'string' && typeof data.amount !== 'number')
      ) {
        throw Error('Data is missing "to" or "amount" field');
      }
      if (!data.fee) {
        data.fee = DEFAULT_FEE;
      }
      setZkappState(prev => {
        return {
          ...prev,
          transactionData: {
            ...data,
            from: sender,
            fee: data.fee || DEFAULT_FEE,
            amount: data.amount,
          },
          showPaymentConfirmation: true,
          isPendingConfirmation: true,
          type: 'send-payment',
        };
      });
      sendResponse('focus-clorio');
      toast.info('Confirm the transaction in your wallet');
    } catch (error) {
      console.error('Error in send-payment:', error);
      sendResponse('error', {message: "Transaction couldn't be sent"});
    }
  };

  const addChain = (data: any) => {
    console.log('Received add-chain');
    sendResponse('focus-clorio');
    setNetworkState(prev => ({
      ...prev,
      showChangeNetworkModal: true,
      addChainData: {...data, url: decodeURIComponent(data.url)},
      isAddingChain: true,
    }));
  };

  const switchChain = async (networkID: string) => {
    const networksFound = availableNetworks.filter(network => network.networkID === networkID);
    if (networksFound.length === 0) {
      toast.error('Network not found');
      sendResponse('error', ERROR_CODES.notSupportChain);
      return;
    }
    sendResponse('focus-clorio');
    console.log('Received switch-chain');
    setNetworkState(prev => ({
      ...prev,
      showChangeNetworkModal: true,
      switchNetwork: networkID,
    }));
  };

  const signTx = async (data: any) => {
    rejectIfLedger();

    try {
      // get the current wallet address

      // TODO: Add method from mina client
      data.fee = data.fee || DEFAULT_FEE;

      // unlockWallet();
      setZkappState(prev => {
        return {
          ...prev,
          transactionData: {
            ...data,
            transaction: JSON.parse(data.transaction),
            from: sender,
          },
          showTransactionConfirmation: true,
          isPendingConfirmation: true,
          type: 'sign-tx',
          isZkappCommand: true,
        };
      });
      sendResponse('focus-clorio');
      toast.info('Confirm the transaction in your wallet');
    } catch (error) {
      console.error('Error in sign-tx:', error);
      sendResponse('error', {message: "Transaction couldn't be sent"});
    }
    // console.log('Received sign-tx');
    // const nextParams = {...data};

    // if (data.isSpeedUp) {
    //   nextParams.memo = decodeMemo(data.memo);
    // }

    // const signedTx: SignedTransaction = await signTransaction(privateKey, nextParams);

    // if (signedTx.error) {
    //   console.error(`Error signing transaction: ${signedTx.error}`);
    //   return {error: signedTx.error};
    // }

    // sendResponse('clorio-signed-tx', signedTx);
  };

  const unlockWallet = () => {
    if (config.isLocked) {
      sendResponse('focus-clorio');
      toast.info('Please unlock your wallet first');
    }
  };

  const verifyMessage = async (data: any) => {
    rejectIfLedger();
    console.log('Received verify-message');
    const parsedDocument = {...data, signature: JSON.parse(data.signature)};
    const verified = await (await client()).verifyMessage(parsedDocument);
    sendResponse('clorio-verified-message', verified);
  };

  const signJsonMessage = async (data: any) => {
    rejectIfLedger();
    sendResponse('focus-clorio');
    console.log('Received sign-json-message');
    setZkappState(prev => ({
      ...prev,
      showMessageSign: true,
      messageToSign: data,
      isJsonMessageToSign: true,
      isNullifier: false,
    }));
  };

  const verifyJsonMessage = async (data: any) => {
    rejectIfLedger();
    console.log('Received verify-json-message');
    const parsedDocument = {...data, signature: JSON.parse(data.signature)};
    const verified = await (await client()).verifyMessage(parsedDocument);
    sendResponse('clorio-verified-json-message', verified);
  };

  const createNullifier = async (data: any) => {
    rejectIfLedger();
    sendResponse('focus-clorio');
    console.log('Received create-nullifier');
    setZkappState(prev => ({
      ...prev,
      showMessageSign: true,
      messageToSign: data.message,
      isNullifier: true,
    }));
  };

  const stakeDelegation = async (data: any) => {
    console.log('Received stake-delegation');
    if (!config.isAuthenticated) {
      sendResponse('focus-clorio');
      toast.error('Please log into your wallet first.');
      return;
    }
    try {
      data.fee = data.fee || DEFAULT_FEE;
      setZkappState(prev => {
        return {
          ...prev,
          transactionData: {...data, from: sender},
          showDelegationConfirmation: true,
          isPendingConfirmation: true,
          type: 'send-delegation',
        };
      });
      sendResponse('focus-clorio');
      toast.info('Confirm the transaction in your wallet');
    } catch (error) {
      console.error('Error in send-delegation:', error);
      sendResponse('error', {message: "Transaction couldn't be sent"});
    }
  };

  const signFields = async (data: any) => {
    rejectIfLedger();
    sendResponse('focus-clorio');
    setZkappState(prev => ({
      ...prev,
      showMessageSign: true,
      messageToSign: data.message,
      isFields: true,
    }));
  };

  const verifyFields = async ({data, publicKey, signature}: any) => {
    rejectIfLedger();
    const nextFields = data.map(BigInt);
    const verifyBody = {
      data: nextFields,
      publicKey: publicKey,
      signature: signature,
    };
    console.log('Received verify-fields');
    const verified = await (await client()).verifyFields(verifyBody);
    sendResponse('clorio-verified-fields', verified);
  };

  const shareUrl = async (url: any) => {
    if (qrCodeRef.current) {
      const deeplink = new URL(`mina://zkapp?URL=${url}`);
      setQrCodeUrl(deeplink.toString());
      qrCodeRef.current.open();
    }
  };

  return (
    <>
      <SignMessage />
      <ConfirmZkappPayment />
      <ConfirmZkappDelegation />
      <ConfirmZkappTransaction />
      <ChangeNetwork />
      <AddChain />
      <ConnectZkapp />
      <QRCodeGenerator
        hideButton
        url={qrCodeUrl}
        ref={qrCodeRef}
      />
    </>
  );
}
