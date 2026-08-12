import {ArrowRight, Globe} from 'react-feather';
import {useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {useRecoilState} from 'recoil';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import {networkState} from '/@/store';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../../Button';
import {ZkappModal, ZkappModalActions, ZkappModalDetails} from './ZkappModal';

export default function ChangeNetwork() {
  const {saveSettings, availableNetworks} = useNetworkSettingsContext();
  const [{showChangeNetworkModal, isAddingChain, selectedNetwork, switchNetwork}, setNetworkState] =
    useRecoilState(networkState);
  const navigate = useNavigate();
  const targetNetwork = switchNetwork
    ? availableNetworks?.[switchNetwork.split(':')[1]]
    : undefined;

  const onClose = () => {
    setNetworkState(prev => ({
      ...prev,
      showChangeNetworkModal: false,
      switchNetwork: undefined,
      isAddingChain: false,
    }));
  };

  const onConfirm = async () => {
    if (!targetNetwork) {
      toast.error('Network not found');
      return;
    }
    try {
      await saveSettings(targetNetwork);
      setNetworkState(prev => ({
        ...prev,
        selectedNetwork: targetNetwork,
        selectedNode: targetNetwork,
        switchNetwork: undefined,
        showChangeNetworkModal: false,
        isAddingChain: false,
      }));
      sendResponse('clorio-switched-chain', {newtorkID: `mina:${switchNetwork}`});
      navigate('/overview');
      toast.success('Network switched successfully');
    } catch (error) {
      toast.error(
        `Failed to switch network: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <ZkappModal
      show={showChangeNetworkModal && !isAddingChain}
      close={onClose}
      title="Switch network"
      subtitle="The active network will change for Clorio and the requesting zkApp."
      icon={<Globe size={20} />}
    >
      <ZkappModalDetails items={[
        {label: 'Current', value: selectedNetwork?.name},
        {label: 'Target', value: targetNetwork?.name || 'Network not found'},
      ]} />
      <ZkappModalActions>
        <Button text="Cancel" variant="outlined" onClick={onClose} />
        <Button
          text="Switch network"
          icon={<ArrowRight size={16} />}
          appendIcon
          style="primary"
          disabled={!targetNetwork}
          onClick={onConfirm}
        />
      </ZkappModalActions>
    </ZkappModal>
  );
}
