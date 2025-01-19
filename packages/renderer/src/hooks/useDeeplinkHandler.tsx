import {useEffect, useMemo} from 'react';
import {useRecoilState, useRecoilValue} from 'recoil';
import {deeplinkState} from '../store/deeplink';
import {URLSearchParams} from 'url';
import {useNavigate} from 'react-router-dom';
import {configState} from '../store';
import {toast} from 'react-toastify';

export enum DeeplinkType {
  NULL = '',
  VERIFY_MESSAGE = 'verify-message',
  DELEGATION = 'stake',
  SEND_TX = 'send-tx',
  ZKAPPS = 'zkapps',
}

const parseDeeplink = (url: string) => {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  const payload = {
    type: DeeplinkType.NULL,
    data: {},
  };
  if (url.includes('verify-message')) {
    payload.data = parseVerifyMessageDeeplink(params);
    payload.type = DeeplinkType.VERIFY_MESSAGE;
  } else if (url.includes('delegation')) {
    payload.data = parseDelegationDeeplink(params);
    payload.type = DeeplinkType.DELEGATION;
  } else if (url.includes('sendtx') || url.includes('send-tx')) {
    payload.data = parseSendTxDeeplink(params);
    payload.type = DeeplinkType.SEND_TX;
  } else if (url.includes('zkapp')) {
    payload.data = parseZkappDeeplink(params);
    payload.type = DeeplinkType.ZKAPPS;
  } else {
    toast.error('Invalid deeplink');
    throw new Error('Invalid deeplink');
  }
  toast.info('Deeplink detected');
  return payload;
};

const parseDelegationDeeplink = (params: URLSearchParams) => {
  const delegator = params.get('to');
  const fee = params.get('fee');
  return {
    delegator,
    fee,
  };
};

const parseVerifyMessageDeeplink = (params: URLSearchParams) => {
  const address = params.get('address');
  const message = params.get('message');
  const field = params.get('field');
  const scalar = params.get('scalar');
  return {
    address,
    message,
    field,
    scalar,
  };
};

const parseSendTxDeeplink = (params: URLSearchParams) => {
  const returningObject = {
    to: '',
    amount: 0,
    fee: 0,
    memo: '',
  };
  for (const param of params.keys()) {
    returningObject[param] = params.get(param);
  }

  if (!returningObject.to || !returningObject.amount) {
    throw new Error('Missing required parameters');
  }

  return returningObject;
};

const parseZkappDeeplink = (params: URLSearchParams) => {
  const returningObject = {
    URL: '',
  };
  for (const param of params.keys()) {
    returningObject[param] = params.get(param);
  }

  if (!returningObject.URL) {
    throw new Error('Missing required parameters');
  }

  return returningObject;
};

function useDeeplinkHandler() {
  const [deeplinkData, setDeeplinkState] = useRecoilState(deeplinkState);
  const navigate = useNavigate();
  const {isAuthenticated, isLocked} = useRecoilValue(configState);

  const isLoggedIn = useMemo(() => isAuthenticated && !isLocked, [isAuthenticated, isLocked]);

  const openDeeplink = (url: string) => {
    const payload = parseDeeplink(url);
    setDeeplinkState(payload);
    changeRoute();
  };

  useEffect(() => {
    const handleDeeplink = (url: string) => {
      const payload = parseDeeplink(url);
      setDeeplinkState(payload);
      changeRoute();
    };

    if (window.deeplink) {
      window.deeplink.onDeeplink(handleDeeplink);
    }

    return () => {
      if (window.deeplink) {
        window.deeplink.off('deeplink', handleDeeplink);
      }
    };
  }, [setDeeplinkState]);

  const changeRoute = () => {
    const {type} = deeplinkData;
    if (isLoggedIn && type) {
      setTimeout(() => {
        navigate(`/${type}`);
      }, 1000);
    }
  };

  useEffect(() => {
    changeRoute();
  }, [isAuthenticated, isLocked, deeplinkData]);

  return {deeplinkData, openDeeplink};
}

export {parseDeeplink};

export default useDeeplinkHandler;
