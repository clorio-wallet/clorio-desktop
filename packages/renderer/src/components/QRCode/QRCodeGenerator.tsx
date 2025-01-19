import React, {useState, useImperativeHandle, forwardRef} from 'react';
import {QRCode} from 'react-qrcode-logo';
import Logo from '../UI/logo/Logo';
import {ModalContainer} from '../UI/modals';
import Button from '../UI/Button';
import QRCodeImage from '../../assets/qrcode.svg';
import {Download} from 'react-feather';
import html2canvas from 'html2canvas';

interface IProps {
  url?: string;
  extended?: boolean;
  hideButton?: boolean;
}

const QRCodeGenerator = forwardRef(function QRCodeGenerator({url, extended, hideButton = false}: IProps, ref) {
  const [showQRCode, setShowQRCode] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setShowQRCode(true),
    close: () => setShowQRCode(false),
  }));

  const onDownload = () => {
    const modalContainer = document.querySelector('.modal-container') as HTMLElement;
    if (modalContainer) {
      const downloadButton = modalContainer.querySelector('#downloadButton') as HTMLElement;
      if (downloadButton) {
        downloadButton.style.display = 'none';
      }
      html2canvas(modalContainer).then(canvas => {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.png';
        a.click();
        if (downloadButton) {
          downloadButton.style.display = '';
        }
      });
    }
  };

  return (
    <>
      {!hideButton && <Button
        className="big-icon-button"
        onClick={() => setShowQRCode(true)}
        appendIcon={!extended}
        style="standard"
        variant="white"
        text={extended ? 'Export QR Code' : ''}
        icon={
          <img
            src={QRCodeImage}
            style={{
              filter: 'invert(1)',
              width: '40px',
              paddingRight: '15px',
            }}
          />
        }
      />}
      <ModalContainer
        show={showQRCode}
        secondaryStyle
        closeOnBackgroundClick
        close={() => setShowQRCode(false)}
        hideCloseButton
        className="modal-container"
      >
        <div className="modal-content flex flex-col items-center gap-5">
          <div>
            <QRCode
              value={url}
              qrStyle="dots"
              removeQrCodeBehindLogo
              eyeRadius={[
                {inner: [1, 0, 0, 0], outer: [10, 0, 0, 0]},
                {inner: [0, 1, 0, 0], outer: [0, 10, 0, 0]},
                {inner: [0, 0, 0, 1], outer: [0, 0, 0, 10]},
              ]}
              bgColor="transparent"
              ecLevel={'L'}
              fgColor="#550000"
              style={{
                marginLeft: '10px',
              }}
            />
            <Logo />
          </div>
          <div id="downloadButton">
            <Button
              text="Download"
              style="standard"
              onClick={onDownload}
              icon={<Download />}
            />
          </div>
        </div>
      </ModalContainer>
    </>
  );
});

export default QRCodeGenerator;
