import {useState, useRef, useEffect} from 'react';
import {AlertOctagon, MoreVertical, Trash2} from 'react-feather';
import Hoc from '../../Hoc';
import Button from '../../Button';
import {useRecoilState, useRecoilValue} from 'recoil';
import {connectedSitesState, deeplinkState} from '/@/store';
import NewZkappConnectionModal from './NewZkappConnectionModal';
import Input from '../../input/Input';
import {toast} from 'react-toastify';
import DropdownMenu from '../../DropdownMenu';
import QRCodeGenerator from '/@/components/QRCode/QRCodeGenerator';
import {DeeplinkType} from '/@/hooks/useDeeplinkHandler';
import QRCodeImage from '../../../../assets/qrcode.svg';
const GOOGLE_FAVICON_URL = 'https://s2.googleusercontent.com/s2/favicons?domain_url=';

const initialZkappData = {
  name: '',
  url: '',
};

export const ZkappConnectedApps = () => {
  const [showNewZkapp, setShowNewZkapp] = useState(false);
  const [{sites}, setConnectedSites] = useRecoilState(connectedSitesState);
  const [newZkapp, setNewZkapp] = useState(initialZkappData);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const qrCodeRef = useRef<{open: () => void}>(null);
  const [{type, data}, setDeeplinkData] = useRecoilState(deeplinkState);

  useEffect(() => {
    if (type === DeeplinkType.ZKAPPS && data) {
      openLink(data.URL);
      setDeeplinkData({type: '', data: ''});
    }
  }, [data, type]);

  const openLink = (url: string) => {
    (window.ipcBridge as any).invoke('open-win', JSON.stringify({url}));
  };

  const isValidUrl = () => {
    try {
      new URL(newZkapp.url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const onSubmit = () => {
    if (!isValidUrl()) {
      toast.info('Invalid URL');
      return;
    }
    openLink(newZkapp.url);
    setNewZkapp(initialZkappData);
    setShowNewZkapp(false);
  };

  const onQRCodeClick = (url: string) => {
    if (qrCodeRef.current) {
      const deeplink = new URL(`mina://zkapp?URL=${url}`);
      setQrCodeUrl(deeplink.toString());
      qrCodeRef.current.open();
    }
  };

  const onDelete = (url: string) => {
    setConnectedSites(prev => ({
      ...prev,
      sites: prev.sites.filter(({source}: {source: string}) => source !== url),
    }));
  };

  return (
    <div className="flex flex-col w-100">
      <div
        className="alert alert-warning zkapp-warning-alert"
        role="alert"
      >
        <AlertOctagon />
        <p className="m-0">
          Connect only to trusted Zkapps. <br />
          Do not enter your private keys on untrusted sites or suspicious sites.
        </p>
      </div>
      <Hoc className=" p-0 flex flex-row mt-4 w-100 glass-card p-4">
        <div
          style={{minWidth: '50px'}}
          className="w-100"
        >
          <h5>Open Zkapp</h5>
          <div className="zkapp-input">
            <Input
              type="text"
              placeholder="Enter URL"
              inputHandler={e => {
                setNewZkapp({...newZkapp, url: e.target.value});
              }}
            />
            <Button
              className="zkapp-open-button"
              text="Open"
              style="primary"
              onClick={onSubmit}
            />
          </div>
          <div className="divider w-100" />
          <h5 className="mb-0">Connected Zkapps</h5>
          <div className="justify-start zkapps-list-container">
            {sites.map(({source, title}: {source: string; title: string}) => (
              <div
                key={source}
                className="glass-card py-2 px-4 cursor-pointer zkapp-list-item flex-1"
                onClick={() => openLink(source)}
              >
                <div className="zkapp-image">
                  <div />
                  <img
                    src={`${GOOGLE_FAVICON_URL}${source}`}
                    alt="favicon"
                    className="zkapp-favicon"
                  />
                  <DropdownMenu buttonLabel={<MoreVertical className="cursor-pointer" />}>
                    <div
                      className="zkapp-dropdown-item"
                      onClick={() => onQRCodeClick(source)}
                    >
                      <img
                        src={QRCodeImage}
                        className="zkapp-qr-code-icon"
                        style={{
                          filter: 'invert(1)',
                        }}
                      />
                      QR Code
                    </div>
                    <div
                      onClick={() => onDelete(source)}
                      className="zkapp-dropdown-item zkapp-dropdown-item-danger"
                    >
                      <Trash2 />
                      Remove
                    </div>
                  </DropdownMenu>
                </div>
                <h4>{title}</h4>
                <p>{source}</p>
              </div>
            ))}
          </div>
        </div>
        <NewZkappConnectionModal
          openLink={openLink}
          setShowNewZkapp={setShowNewZkapp}
          showNewZkapp={showNewZkapp}
        />
      </Hoc>
      <QRCodeGenerator
        ref={qrCodeRef}
        url={qrCodeUrl}
        hideButton
      />
    </div>
  );
};
