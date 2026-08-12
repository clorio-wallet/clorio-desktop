import {useRecoilState} from 'recoil';
import {networkState} from '../../../../store';
import Button from '../../Button';
import {sendResponse} from '../../../../tools/mina-zkapp-bridge';
import {toast} from 'react-toastify';
import {useNavigate} from 'react-router-dom';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import {ERROR_CODES} from '/@/tools/zkapp';
import {AlertTriangle, PlusCircle} from 'react-feather';
import {
  ZkappModal,
  ZkappModalActions,
  ZkappModalDetails,
  ZkappModalNotice,
} from './ZkappModal';

const NODE_INFO: string = `
query NodeInfo {
    nodeInfo {
      height
      name
      network
      version
    }
  }`;

export default function AddChain() {
  const {saveSettings, availableNetworks, setAvailableNetworks} = useNetworkSettingsContext();
  const [{isAddingChain, addChainData}, setNetworkState] = useRecoilState(networkState);
  const navigate = useNavigate();

  const onClose = () => {
    setNetworkState(prev => ({
      ...prev,
      showChangeNetworkModal: false,
      switchNetwork: undefined,
      isAddingChain: false,
      addChainData: undefined,
    }));
    sendResponse('error', ERROR_CODES.userRejectedRequest);
  };

  const onConfirm = async () => {
    if (await testNetworkNode()) {
      networkSelectHandler();
    }
  };

  const networkSelectHandler = async () => {
    try {
      const networkData = {
        url: addChainData?.url ?? '',
        network: addChainData?.name ?? '',
        name: addChainData?.name ?? '',
        label: addChainData?.name ?? '',
      };
      setAvailableNetworks({...availableNetworks, [networkData.name]: networkData});
      saveSettings(networkData);
      setNetworkState(prev => ({
        ...prev,
        selectedNetwork: {
          chainId: addChainData?.name ?? '',
          name: addChainData?.name ?? '',
        },
        selectedNode: networkData,
        addChainData: undefined,
        switchNetwork: undefined,
        showChangeNetworkModal: false,
        isAddingChain: false,
      }));
      sendResponse('clorio-added-chain', {
        chainId: addChainData?.name ?? '',
        name: addChainData?.name ?? '',
      });
      navigate('/overview');
      toast.success('Network switched successfully');
    } catch (error) {
      toast.error(
        `Failed to switch network: ${error instanceof Error ? error.message : String(error)}`,
      );
      sendResponse('error', ERROR_CODES.notSupportChain);
    }
  };

  // Test network node quering for the network details before switching
  const testNetworkNode = async () => {
    try {
      if (!addChainData?.url) throw new Error('Missing node URL');
      const resp = await fetch(addChainData.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: NODE_INFO,
        }),
      }).then(res => res.json());
      if (resp.errors) {
        throw new Error(resp.errors[0].message);
      }
      return true;
    } catch (error) {
      toast.error('Invalid node');
    }
  };

  return (
    <ZkappModal
      show={isAddingChain}
      close={onClose}
      title="Add network"
      subtitle="Review the node details before adding this network to Clorio."
      icon={<PlusCircle size={20} />}
    >
      <ZkappModalDetails items={[
        {label: 'Network', value: addChainData?.name},
        {label: 'Node URL', value: addChainData?.url, title: addChainData?.url},
      ]} />
      <ZkappModalNotice warning icon={<AlertTriangle size={17} />} title="Custom network">
        Only add nodes you recognize. A malicious node can return misleading blockchain data.
      </ZkappModalNotice>
      <ZkappModalActions>
        <Button text="Cancel" variant="outlined" onClick={onClose} />
        <Button text="Add network" style="primary" onClick={onConfirm} />
      </ZkappModalActions>
    </ZkappModal>
  );
}
