import React from 'react';
import Button from '../UI/Button';
import {parseDeeplink} from '../../hooks/useDeeplinkHandler';
import ZkappConnectDisclaimer from '../UI/ZkappConnectDisclaimer';
import {toast} from 'react-toastify';

interface IProps {
  url: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const labels = {
  'send-tx': 'Send transaction',
  stake: 'Delegation',
  'verify-message': 'Verify message',
  zkapps: 'Open ZkApp',
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const QrCodeResult: React.FC<IProps> = ({url, onConfirm, onCancel}) => {
  let formattedData: any;

  const cleanData = data => {
    const formattedDataToReturn = {...data.data};
    if (data.type === 'send-tx' || data.type === 'stake') {
      if (data.data.amount) {
        formattedDataToReturn.amount = `${+data.data.amount} MINA`;
      }
      if (data.data.fee) {
        formattedDataToReturn.fee = `${+data.data.fee} MINA`;
      }
    }
    return {type: data.type, data: {...formattedDataToReturn}};
  };

  try {
    const parsedData = parseDeeplink(url);
    formattedData = cleanData(parsedData);
  } catch (error) {
    formattedData = 'Invalid deeplink';
    toast.error('Invalid deeplink');
    onCancel();
  }

  return (
    <div className="qr-code-result">
      <h1>Summary - {labels[formattedData?.type]}</h1>
      {formattedData?.type === 'zkapps' && <ZkappConnectDisclaimer alt />}
      <div className="mb-4">
        {formattedData &&
          typeof formattedData === 'object' &&
          formattedData.data &&
          Object.keys(formattedData.data).map(
            key =>
              !!formattedData?.data[key] && (
                <React.Fragment key={key}>
                  <hr />
                  <div className="flex flex-row justify-between qr-code-data-row">
                    <h5>{capitalizeFirstLetter(key)}</h5>
                    <p>{formattedData?.data[key]}</p>
                  </div>
                </React.Fragment>
              ),
          )}
      </div>
      <div className="flex flex-row">
        <Button
          className="w-100"
          text="Cancel"
          style="standard"
          variant="outlined"
          onClick={onCancel}
        />
        <Button
          onClick={onConfirm}
          text="Open link"
          style="primary"
        />
      </div>
    </div>
  );
};

export default QrCodeResult;
