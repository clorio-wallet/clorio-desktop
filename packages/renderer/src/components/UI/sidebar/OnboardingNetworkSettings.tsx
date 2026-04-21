import {ReactNode, useEffect, useState} from 'react';
import {X, Globe, Zap, ChevronDown} from 'react-feather';
import {Form} from 'react-bootstrap';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import {useNavigate} from 'react-router-dom';
import {INetworkData} from '/@/types';
import {getPassphraseFlag} from '/@/tools';
import {useRecoilState} from 'recoil';
import {networkState} from '/@/store';
import {ConnectedZkapps} from './ConnectedZkapps';
import {NetConfig, sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../Button';

interface OnboardingNetworkSettingsProps {
  currentNetwork: ReactNode;
  network: INetworkData | undefined;
}

export default function OnboardingNetworkSettings({
  currentNetwork,
  network,
}: OnboardingNetworkSettingsProps) {
  const [showModal, setShowModal] = useState(false);
  const [storedPassphrase, setStoredPassphrase] = useState('');
  const {settings, saveSettings, availableNetworks} = useNetworkSettingsContext();
  const navigate = useNavigate();
  const [, setNetworkState] = useRecoilState(networkState);

  const selectedNetworkValue =
    availableNetworks && Object.keys(availableNetworks).length > 1
      ? !settings?.label
        ? Object.keys(availableNetworks).findIndex((key: string) =>
            availableNetworks[key].label?.includes('mainnet'),
          )
        : Object.keys(availableNetworks).findIndex(
            (key: string) => availableNetworks[key].label === settings?.label,
          )
      : 0;

  useEffect(() => {
    const flag = getPassphraseFlag();
    setStoredPassphrase(flag ? 'true' : '');
  }, []);

  const networkSelectHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!availableNetworks) return;
    const selectedKey = Object.keys(availableNetworks)[parseInt(e.target.value)];
    if (!selectedKey) return;

    const selectedNetwork = availableNetworks[selectedKey];
    if (!selectedNetwork) return;

    saveSettings(selectedNetwork);
    setNetworkState(prev => ({
      ...prev,
      selectedNetwork: {
        chainId: selectedNetwork.network || '',
        name: selectedNetwork.name || '',
      },
      selectedNode: selectedNetwork,
    }));
    sendResponse('chain-change', {
      chainId: selectedNetwork.network || '',
      name: selectedNetwork.name || '',
    } as NetConfig);
    navigate('/overview');
  };

  const closeModal = () => setShowModal(false);

  if (!showModal) {
    return (
      <Button
        onClick={() => setShowModal(true)}
        className="onboarding-settings-trigger"
        aria-label="Open settings"
        style="link"
        text="Settings"
      />
    );
  }

  return (
    <div
      className="onboarding-settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-settings-title"
    >
      <div
        className="onboarding-settings-backdrop"
        onClick={closeModal}
      />
      <div className="onboarding-settings-modal">
        {/* Header */}
        <header className="onboarding-settings-header">
          <div className="onboarding-settings-title-group">
            <div className="onboarding-settings-icon">
              <Zap size={20} />
            </div>
            <div>
              <h2
                id="onboarding-settings-title"
                className="onboarding-settings-title"
              >
                Settings
              </h2>
              <p className="onboarding-settings-version">Version 2.1.6</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="onboarding-settings-close"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="onboarding-settings-content">
          {/* Network Status Card */}
          <div className="onboarding-settings-card">
            <div className="onboarding-settings-card-header">
              <Globe size={16} />
              <span>Network</span>
            </div>
            <div className="onboarding-settings-card-body">
              {network?.nodeInfo?.syncStatus && (
                <div className="onboarding-settings-row">
                  <span className="onboarding-settings-label">Status</span>
                  <span className="onboarding-settings-status">
                    <span className="onboarding-settings-status-dot" />
                    {network.nodeInfo.syncStatus}
                  </span>
                </div>
              )}
              {/* Network Selection */}
              <div className="onboarding-settings-select-group">
                <div className="onboarding-settings-select-wrapper">
                  <Form.Select
                    className="onboarding-settings-select"
                    aria-label="Select a network"
                    onChange={networkSelectHandler}
                    value={selectedNetworkValue}
                  >
                    {availableNetworks &&
                      Object.keys(availableNetworks).map((key, index) => {
                        const networkData = availableNetworks[key];
                        return (
                          <option
                            key={networkData.label || key}
                            value={index}
                          >
                            {networkData.label || key}
                          </option>
                        );
                      })}
                  </Form.Select>
                  <ChevronDown
                    size={16}
                    className="onboarding-settings-select-icon"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Connected Apps Card */}
          <div className="onboarding-settings-card">
            <div className="onboarding-settings-card-header">
              <Zap size={16} />
              <span>Connected Apps</span>
            </div>
            <div className="onboarding-settings-card-body">
              <div className="onboarding-settings-row">
                <span className="onboarding-settings-label">Active connections</span>
                <ConnectedZkapps />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="onboarding-settings-footer">
          <p className="onboarding-settings-hint">Changes will apply immediately</p>
        </footer>
      </div>
    </div>
  );
}
