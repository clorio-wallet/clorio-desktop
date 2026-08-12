import {AlertTriangle, ExternalLink} from 'react-feather';
import {useState} from 'react';
import {toast} from 'react-toastify';
import Button from '../../Button';
import Input from '../../input/Input';
import {
  ZkappModal,
  ZkappModalActions,
  ZkappModalNotice,
} from './ZkappModal';

const initialZkappData = {name: '', url: ''};

export default function NewZkappConnectionModal({
  showNewZkapp,
  setShowNewZkapp,
  openLink,
}: {
  showNewZkapp: boolean;
  setShowNewZkapp: (show: boolean) => void;
  openLink: (url: string) => void;
}) {
  const [newZkapp, setNewZkapp] = useState(initialZkappData);
  const close = () => setShowNewZkapp(false);

  const onSubmit = () => {
    try {
      const url = new URL(newZkapp.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      openLink(url.toString());
      setNewZkapp(initialZkappData);
      close();
    } catch {
      toast.info('Enter a valid HTTP or HTTPS URL');
    }
  };

  return (
    <ZkappModal
      show={showNewZkapp}
      close={close}
      title="Open zkApp"
      subtitle="Enter the address of the zkApp you want to open in Clorio."
      icon={<ExternalLink size={20} />}
    >
      <div>
        <h4>zkApp URL</h4>
        <Input
          type="url"
          value={newZkapp.url}
          placeholder="https://example.com"
          inputHandler={event => setNewZkapp({...newZkapp, url: event.target.value})}
        />
      </div>
      <ZkappModalNotice warning icon={<AlertTriangle size={17} />} title="Open trusted sites only">
        Never enter your private key or recovery phrase into a zkApp.
      </ZkappModalNotice>
      <ZkappModalActions>
        <Button text="Cancel" variant="outlined" onClick={close} />
        <Button text="Open zkApp" style="primary" disabled={!newZkapp.url} onClick={onSubmit} />
      </ZkappModalActions>
    </ZkappModal>
  );
}
