import React, {useState} from 'react';
import {toast} from 'react-toastify';
import {Jimp} from 'jimp';
import QrCode from 'qrcode-reader';
import Button from '../UI/Button';
import Disclaimer from './Disclaimer';

interface IProps {
  goBack: () => void;
  setUrl: (url: string) => void;
}

export const QrCodeUploadReader: React.FC = ({goBack, setUrl}: IProps) => {
  const [dragging, setDragging] = useState(false);
  const handleScan = (result: string | null) => {
    if (result) {
      try {
        setUrl(result);
      } catch (error) {
        console.log('🚀 ~ handleScan ~ error:', error);
        toast.error('Invalid deeplink');
      }
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    toast.error('Invalid QR Code');
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = event => {
      Jimp.read(event.target?.result as string)
        .then(image => {
          const qr = new QrCode();
          qr.callback = (err: any, value: any) => {
            if (err) {
              handleError(err);
              return;
            }
            if (value && value.result) {
              handleScan(value.result);
            } else {
              handleError(new Error('Could not decode QR code'));
            }
          };
          qr.decode(image.bitmap);
        })
        .catch(err => {
          handleError(err);
        });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      if (event.target.files && event.target.files.length > 0) {
        handleFile(event.target.files[0]);
      }
    };
    input.click();
  };

  return (
    <div>
      <h1>QR Code Reader</h1>
      <hr />
      <Disclaimer />
      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {dragging
          ? 'Drop the image here...'
          : 'Drag and drop an image here, or click to select an image'}
      </div>
      <Button
        onClick={goBack}
        text="Go back"
        style="primary"
      />
    </div>
  );
};
