import {useQuery} from '@apollo/client';
import {GET_NETWORK} from '../../graphql/query';
import type {INetworkData} from '../../types/NetworkData';
import NetworkSettings from './sidebar/NetworkSettings';
import OnboardingNetworkSettings from './sidebar/OnboardingNetworkSettings';

interface FooterProps {
  isOnboarding?: boolean;
}

const Footer = ({ isOnboarding = true }: FooterProps) => {
  const {data: network} = useQuery<INetworkData>(GET_NETWORK);
  const renderNetwork = network?.nodeInfo
    ? `${network.nodeInfo.name} | ${network.nodeInfo.network}`
    : 'Network unavailable';

  return (
    <div className="full-width-align-center footer-text">
      ~Clorio is a wallet for Mina Protocol offered by WeStake.Club.
      <br />
      <div>{renderNetwork}</div>
      {isOnboarding ? (
        <OnboardingNetworkSettings
          currentNetwork={renderNetwork}
          network={network}
        />
      ) : (
        <NetworkSettings
          currentNetwork={renderNetwork}
          network={network!}
          hideBackup
        />
      )}
    </div>
  );
};

export default Footer;
