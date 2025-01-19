import {useState} from 'react';
import {AlertOctagon} from 'react-feather';
import Hoc from '../../Hoc';
import Button from '../../Button';
import {useRecoilValue} from 'recoil';
import {connectedSitesState} from '/@/store';
import NewZkappConnectionModal from './NewZkappConnectionModal';
import Input from '../../input/Input';
import {toast} from 'react-toastify';
import ZkappsList from './ZkappsList';
export const GOOGLE_FAVICON_URL = 'https://s2.googleusercontent.com/s2/favicons?domain_url=';

const initialZkappData = {
  name: '',
  url: '',
};

export const ZkappConnectedApps = () => {
  const [showNewZkapp, setShowNewZkapp] = useState(false);
  const {sites} = useRecoilValue(connectedSitesState);
  const [newZkapp, setNewZkapp] = useState(initialZkappData);
  const [showZkapps, setShowZkapps] = useState(true);

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
          <div className="flex flex-row justify-start gap-4">
            <Button
              text="Explore Zkapps"
              onClick={() => setShowZkapps(true)}
              className={`zkapp-explore-button${showZkapps ? '-active' : ''}`}
            />
            <Button
              text="Connected Zkapps"
              onClick={() => setShowZkapps(false)}
              className={`zkapp-explore-button${!showZkapps ? '-active' : ''}`}
            />
          </div>
          {showZkapps ? (
            <ZkappsList />
          ) : (
            <div className="justify-start zkapps-list-container">
              {sites.map(({source, title}: {source: string; title: string}) => (
                <div
                  key={source}
                  className="glass-card py-2 px-4 cursor-pointer zkapp-list-item flex-1"
                  onClick={() => openLink(source)}
                >
                  <img
                    src={`${GOOGLE_FAVICON_URL}${source}`}
                    alt="favicon"
                    className="zkapp-favicon"
                  />
                  <h4>{title}</h4>
                  <p>{source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <NewZkappConnectionModal
          openLink={openLink}
          setShowNewZkapp={setShowNewZkapp}
          showNewZkapp={showNewZkapp}
        />
      </Hoc>
    </div>
  );
};
