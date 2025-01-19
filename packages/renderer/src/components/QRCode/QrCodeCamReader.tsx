import React from 'react';
import {QrReader} from 'react-qr-reader';
import Button from '../UI/Button';
import {toast} from 'react-toastify';
import Disclaimer from './Disclaimer';

interface IProps {
  goBack: () => void;
  setUrl: (url: string) => void;
}

export const QrCodeCameraReader: React.FC<IProps> = ({goBack, setUrl}: IProps) => {
  const handleScan = (data: string) => {
    if (data) {
      try {
        setUrl(data);
      } catch (error) {
        toast.error('Invalid deeplink');
      }
    }
  };

  return (
    <div>
      <h1>QR Code Reader</h1>
      <hr />
      <Disclaimer />
      <QrReader
        onResult={result => {
          if (result) {
            handleScan(result.getText());
          }
        }}
        constraints={{facingMode: 'environment'}}
      />
      <Button
        onClick={goBack}
        text="Go back"
        style="primary"
      />
    </div>
  );
};
