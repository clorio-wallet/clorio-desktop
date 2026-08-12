import {AlertTriangle, Link} from 'react-feather';
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {connectZkappState, connectedSitesState, walletState} from '/@/store';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../../Button';
import {
  ZkappModal,
  ZkappModalActions,
  ZkappModalDetails,
  ZkappModalNotice,
} from './ZkappModal';

export default function ConnectZkapp() {
  const wallet = useRecoilValue(walletState);
  const updateConnectedSites = useSetRecoilState(connectedSitesState);
  const {address: sender} = wallet;
  const [{showConnectZkapp, source, title}, updateConnectZkapp] = useRecoilState(connectZkappState);

  const onClose = () => {
    updateConnectZkapp(prev => ({...prev, showConnectZkapp: false, source: '', title: ''}));
  };

  const onConfirm = async () => {
    updateConnectedSites((prev: any) => ({
      ...prev,
      sites: [...prev.sites, {source, title}],
    }));
    sendResponse('account-change', sender);
    sendResponse('clorio-set-address', [sender]);
    onClose();
  };

  return (
    <ZkappModal
      show={showConnectZkapp}
      close={onClose}
      title="Connect zkApp"
      subtitle="Allow this site to view your active account address."
      icon={<Link size={20} />}
    >
      <ZkappModalDetails items={[
        {label: 'Site', value: title || source, title: source},
        {label: 'Account', value: sender, title: sender},
      ]} />
      <ZkappModalNotice warning icon={<AlertTriangle size={17} />} title="Check the requesting site">
        Connect only to zkApps you recognize and trust.
      </ZkappModalNotice>
      <ZkappModalActions>
        <Button text="Cancel" variant="outlined" onClick={onClose} />
        <Button text="Connect" style="primary" onClick={onConfirm} />
      </ZkappModalActions>
    </ZkappModal>
  );
}
