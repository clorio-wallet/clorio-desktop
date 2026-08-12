import {ReactNode, useEffect, useState} from 'react';
import {Globe, Zap, ChevronDown, Lock, LogOut, Settings} from 'react-feather';
import {Form} from 'react-bootstrap';
import {ModalContainer} from '../modals';
import Button from '../Button';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import {useNavigate} from 'react-router-dom';
import BackupWallet from '../modals/BackupWallet';
import {INetworkData} from '/@/types';
import {getPassphraseFlag} from '/@/tools';
import {useRecoilState} from 'recoil';
import {networkState} from '/@/store';
import {ConnectedZkapps} from './ConnectedZkapps';
import {NetConfig, sendResponse} from '/@/tools/mina-zkapp-bridge';
import {isElectron} from '/@/tools/environment';

export default function NetworkSettings({
  currentNetwork,
  logout,
  lockSession,
  network,
  hideBackup = false,
}: {
  network: INetworkData;
  currentNetwork: ReactNode;
  logout?: () => void;
  lockSession?: () => void;
  hideBackup?: boolean;
}) {
  const toggleBackupModal = () => setShowBackupModal(!showBackupModal);

  const [showBackupModal, setShowBackupModal] = useState(false);
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

  return (
    <>
      <span
        onClick={() => setShowModal(true)}
        className="cursor-pointer purple-text-hover"
      >
        <Settings
          cursor={'pointer'}
          width={15}
        />{' '}
        Settings
      </span>
      <ModalContainer
        show={showModal}
        close={closeModal}
        className="onboarding-settings-wrapper"
      >
        {/* Header */}
        <header className="onboarding-settings-header">
          <div className="onboarding-settings-title-group">
            <div className="onboarding-settings-icon">
              <Settings size={40} />
            </div>
            <div>
              <h2 className="onboarding-settings-title">Settings</h2>
              <p className="onboarding-settings-version">Version 2.1.6</p>
            </div>
          </div>
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

          {/* Backup Wallet Card */}
          {!hideBackup && storedPassphrase && (
            <div className="onboarding-settings-card">
              <div className="onboarding-settings-card-header">
                <Settings size={16} />
                <span>Security</span>
              </div>
              <div className="onboarding-settings-card-body">
                <div className="onboarding-settings-row">
                  <span className="onboarding-settings-label">Backup wallet</span>
                  <Button
                    onClick={toggleBackupModal}
                    text="Backup"
                    style="link"
                    className="link-button custom-delegate-button purple-text align-end no-padding"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="onboarding-settings-actions">
            {lockSession && isElectron() && (
              <button
                className="onboarding-settings-action-button"
                onClick={lockSession}
              >
                <Lock size={18} />
                <span>Lock session</span>
              </button>
            )}
            {logout && (
              <button
                className="onboarding-settings-action-button onboarding-settings-action-button--danger"
                onClick={logout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        <ModalContainer show={showBackupModal}>
          <BackupWallet closeModal={toggleBackupModal} />
        </ModalContainer>
      </ModalContainer>
    </>
  );
}
