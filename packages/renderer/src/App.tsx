import {HashRouter} from 'react-router-dom';
import Layout from './Layout';
import {ApolloProvider} from '@apollo/client';
import {LedgerContextProvider} from './contexts/ledger/LedgerContext';
import {apolloClient} from './graphql/api';
import 'react-loading-skeleton/dist/skeleton.css';
import './App.scss';
import {formatNetworks, useNetworkSettingsContext} from './contexts/NetworkContext';
import {BalanceContextProvider} from './contexts/balance/BalanceContext';
import {useEffect} from 'react';
import {WalletProvider} from './contexts/WalletContext';
import {clearSession} from './tools';
import {networkState} from './store';
import {useRecoilState} from 'recoil';
import * as React from 'react';

// Dynamic import for DevTools to avoid build errors if the folder is ignored/missing
const DevTools = React.lazy(() =>
  import('./dev-tools/DevTools').catch(() => ({default: () => null})),
);

function App() {
  const {settings, setAvailableNetworks, saveSettings} = useNetworkSettingsContext();
  const [{selectedNetwork, selectedNode}, setNetworkState] = useRecoilState(networkState);

  useEffect(() => {
    clearSession();
    getNetworks();
  }, []);

  const selectDefaultNetwork = (networks: string[]) => {
    // const urlEnv = window.location.href.split('//')[1].split('.clor')[0];
    // if (networks.includes(urlEnv)) {
    //   return urlEnv;
    // } else
    if (networks.includes('mainnet')) {
      return 'mainnet';
    } else if (networks.includes('devnet')) {
      return 'devnet';
    } else if (networks.includes('berkeley')) {
      return 'berkeley';
    } else {
      return networks[0];
    }
  };

  const getNetworks = async () => {
    const hasInitialSettings = !!settings?.url;
    const data = await fetch(import.meta.env.VITE_REACT_APP_NETWORK_LIST)
      .then(response => response.json())
      .then(data => data);
    if (data) {
      const formattedNetworks = formatNetworks(data);
      const newAvailableNetworks = Object.values(formattedNetworks).map(
        ({network, name}: {network: string; name: string}) => {
          return {chainId: network, name: name, networkID: `mina:${network}`};
        },
      );
      setNetworkState(prev => ({
        ...prev,
        availableNetworks: newAvailableNetworks,
        showChangeNetworkModal: false,
      }));
      setAvailableNetworks(formattedNetworks);

      if (!selectedNetwork) {
        const defaultNetwork = selectDefaultNetwork(
          formattedNetworks.map(({label}) => {
            return label;
          }),
        );
        setNetworkState(prev => ({
          ...prev,
          selectedNetwork: {
            chainId: data[defaultNetwork].network,
            name: data[defaultNetwork].name,
            networkID: `mina:${data.network}`,
          },
        }));
      }
      if (!hasInitialSettings) {
        const network = selectDefaultNetwork(Object.keys(data));
        saveSettings(data[network]);
        setNetworkState(prev => ({...prev, selectedNode: data[network]}));
      }
    }
  };

  return (
    <div className="App">
      <WalletProvider>
        <BalanceContextProvider>
          <React.Suspense fallback={null}>
            <DevTools />
          </React.Suspense>
          <ApolloProvider client={apolloClient(selectedNode!)}>
            <LedgerContextProvider>
              <HashRouter>
                <Layout />
              </HashRouter>
            </LedgerContextProvider>
          </ApolloProvider>
        </BalanceContextProvider>
      </WalletProvider>
    </div>
  );
}

export default App;
