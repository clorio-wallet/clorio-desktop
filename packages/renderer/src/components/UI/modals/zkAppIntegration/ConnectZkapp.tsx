import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import {ModalContainer} from '../ModalContainer';
import {connectZkappState, connectedSitesState, walletState} from '/@/store';
import Button from '../../Button';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import {AlertOctagon} from 'react-feather';
import ZkappConnectDisclaimer from '../../ZkappConnectDisclaimer';

export default function ConnectZkapp() {
  const wallet = useRecoilValue(walletState);
  const updateConnectedSites = useSetRecoilState(connectedSitesState);
  const {address: sender} = wallet;
  const [{showConnectZkapp, source, title}, updateConnectZkapp] = useRecoilState(connectZkappState);
  const onClose = () => {
    updateConnectZkapp(prev => ({
      ...prev,
      showConnectZkapp: false,
      source: '',
      title: '',
    }));
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
    <ModalContainer
      show={showConnectZkapp}
      close={onClose}
      className="confirm-transaction-modal"
      closeOnBackgroundClick={false}
    >
      <div>
        <h1>Connection Request</h1>
        <hr />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col w-100">
          <h4>This website would like to view account:</h4>
          <p className="data-field mb-4 mt-2">{source}</p>
          <ZkappConnectDisclaimer />
        </div>
        <div className="flex mt-2 gap-4 confirm-transaction-data sm-flex-reverse">
          <Button
            className="w-100"
            text="Cancel"
            style="standard"
            variant="outlined"
            onClick={onClose}
          />
          <Button
            className="w-100"
            text="Confirm"
            style="primary"
            onClick={onConfirm}
          />
        </div>
      </div>
    </ModalContainer>
  );
}
