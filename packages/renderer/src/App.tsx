import {HashRouter} from 'react-router-dom';
import Layout from './Layout';
import {ApolloProvider} from '@apollo/client';
import {LedgerContextProvider} from './contexts/ledger/LedgerContext';
import {apolloClient} from './graphql/api';
import 'react-loading-skeleton/dist/skeleton.css';
import './App.scss';
import {formatNetworks, useNetworkSettingsContext} from './contexts/NetworkContext';
import type {INetworkOption} from './hooks/useNetworkSettings';
import {BalanceContextProvider} from './contexts/balance/BalanceContext';
import {useEffect, useState} from 'react';

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
  const [networksReady, setNetworksReady] = useState(false);

  /**
   * Returns the active network node for ApolloProvider.
   * Falls back to `settings` (loaded from localStorage or env) when
   * `selectedNode` is still undefined on the first render — prevents
   * Apollo from firing requests to localhost:3000/graphql.
   */
  const activeNode: INetworkOption | null = networksReady ? selectedNode ?? settings : null;

  useEffect(() => {
    clearSession();
  }, []);

  useEffect(() => {
    if (!settings) {
      return;
    }

    getNetworks();
  }, [settings]);

  const selectDefaultNetwork = (networks: string[]) => {
    if (networks.includes('mainnet')) {
      return 'mainnet';
    } else if (networks.includes('devnet')) {
      return 'devnet';
    } else {
      return networks[0];
    }
  };

  const getNetworks = async () => {
    setNetworksReady(false);
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

      const matchingNetwork =
        formattedNetworks.find(({url, label, name}) => {
          return url === settings?.url || label === settings?.label || name === settings?.name;
        }) ||
        formattedNetworks.find(({network}) => {
          return network === settings?.network;
        }) ||
        null;

      if (matchingNetwork) {
        setNetworkState(prev => ({
          ...prev,
          selectedNode: matchingNetwork,
          selectedNetwork: {
            chainId: matchingNetwork.network || '',
            name: matchingNetwork.name || matchingNetwork.label || '',
            networkID: `mina:${matchingNetwork.network || ''}`,
          },
        }));
        setNetworksReady(true);
        return;
      }

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
            networkID: `mina:${data[defaultNetwork].network}`,
          },
        }));
      }

      const network = selectDefaultNetwork(Object.keys(data));
      saveSettings(data[network]);
      setNetworkState(prev => ({...prev, selectedNode: data[network]}));
      setNetworksReady(true);
      return;
    }

    setNetworksReady(true);
  };

  return (
    <div className="App">
      <BalanceContextProvider>
        <React.Suspense fallback={null}>
          <DevTools />
        </React.Suspense>
        {activeNode ? (
          <ApolloProvider client={apolloClient(activeNode)}>
            <LedgerContextProvider>
              <HashRouter>
                <Layout />
              </HashRouter>
            </LedgerContextProvider>
          </ApolloProvider>
        ) : null}
      </BalanceContextProvider>
    </div>
  );
}

export default App;
