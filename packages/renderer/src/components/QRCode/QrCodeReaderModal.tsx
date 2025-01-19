import React, {useState} from 'react';
import {ModalContainer} from '../UI/modals';
import Button from '../UI/Button';
import QRCodeImage from '../../assets/qrcode.svg';
import TypeSeleciton from './TypeSelection';
import {QrCodeCameraReader} from './QrCodeCamReader';
import {QrCodeUploadReader} from './QrCodeUploadReader';
import useDeeplinkHandler from '/@/hooks/useDeeplinkHandler';
import QrCodeResult from './QrCodeResult';

enum STEPS {
  'INITIAL',
  'CAMERA',
  'UPLOAD',
  'RESULT',
}

export const QrCodeReader: React.FC = () => {
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [step, setStep] = useState<STEPS>(STEPS.INITIAL);
  const [url, setUrl] = useState<string>('');
  const {openDeeplink} = useDeeplinkHandler();

  const onClose = () => {
    setShowQrCodeModal(false);
    setUrl('');
    setStep(STEPS.INITIAL);
  };

  const onGoBack = () => {
    setStep(STEPS.INITIAL);
  };

  const onUrlChange = (url: string) => {
    setUrl(url);
    setStep(STEPS.RESULT);
  };

  const onDeeplinkConfirm = () => {
    openDeeplink(url);
    onClose();
  };

  return (
    <>
      <Button
        className="big-icon-button"
        onClick={() => setShowQrCodeModal(true)}
        appendIcon={true}
        style="standard"
        variant="white"
        icon={
          <img
            src={QRCodeImage}
            style={{
              // invert colors of the image
              filter: 'invert(1)',
              width: '40px',
              paddingRight: '15px',
            }}
          />
        }
      />
      {showQrCodeModal && (
        <ModalContainer
          show={showQrCodeModal}
          className="big-modal-container z-100 max-w-800"
          close={onClose}
          closeOnBackgroundClick={true}
        >
          {step === STEPS.INITIAL && (
            <TypeSeleciton
              onCamera={() => setStep(STEPS.CAMERA)}
              onUpload={() => setStep(STEPS.UPLOAD)}
            />
          )}
          {step === STEPS.CAMERA && (
            <QrCodeCameraReader
              goBack={onGoBack}
              setUrl={onUrlChange}
            />
          )}
          {step === STEPS.UPLOAD && (
            <QrCodeUploadReader
              goBack={onGoBack}
              setUrl={onUrlChange}
            />
          )}
          {step === STEPS.RESULT && (
            <QrCodeResult
              url={url}
              onConfirm={onDeeplinkConfirm}
              onCancel={onGoBack}
            />
          )}
        </ModalContainer>
      )}
    </>
  );
};
