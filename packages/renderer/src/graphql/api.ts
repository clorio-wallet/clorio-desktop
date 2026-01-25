import {ApolloLink, HttpLink, ApolloClient, InMemoryCache} from '@apollo/client';
import {onError} from '@apollo/client/link/error';
import type {NormalizedCacheObject} from '@apollo/client';
import {INetworkOption} from '../hooks/useNetworkSettings';

const httpLink = (networkSettings: INetworkOption) =>
  ApolloLink.from([
    onError(({graphQLErrors, networkError}) => {
      if (graphQLErrors)
        graphQLErrors.forEach(({message, locations, path}) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
          ),
        );
      if (networkError) console.log(`[Network error]: ${networkError}`);
    }),
    new HttpLink({
      uri: networkSettings?.url || import.meta.env.VITE_REACT_APP_GQL_SERVER,
      credentials: 'same-origin',
      fetchOptions: {
        reconnect: true,
        connectionParams: async () => {
          return {
            headers: {
              'x-hasura-role': 'anon',
            },
          };
        },
      },
    }),
  ]);

export const apolloClient = (networkSettings: INetworkOption): ApolloClient<NormalizedCacheObject> =>
  new ApolloClient<NormalizedCacheObject>({
    link: httpLink(networkSettings) as any,
    cache: new InMemoryCache(),
  });
