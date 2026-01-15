import {useEffect, useContext, useRef, useState} from 'react';
import {useRecoilValue} from 'recoil';
import {useQuery} from '@apollo/client';
import {walletState} from '/@/store';
import {BalanceContext} from '../../contexts/balance/BalanceContext';
import {IBalanceContext} from '../../contexts/balance/BalanceTypes';
import {GET_TICKER, GET_BALANCE} from '../../graphql/query';
import {DEFAULT_QUERY_REFRESH_INTERVAL} from '../../tools';
import {IBalanceQueryResult, ITicker} from './BalanceTypes';

export const useElementWidth = (offset = 150) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width - offset);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [offset]);

  return {ref, width};
};

export const useBalanceData = () => {
  const wallet = useRecoilValue(walletState);
  const {address} = wallet;

  const {
    addBalance,
    setBalanceContext,
    shouldBalanceUpdate,
    setShouldBalanceUpdate,
    balanceData: balance,
  } = useContext<Partial<IBalanceContext>>(BalanceContext);

  const {
    data: tickerData,
    loading: tickerLoading,
    error: tickerError,
  } = useQuery<ITicker>(GET_TICKER);

  const formatBalanceForContext = (balance: any) => ({
    liquid: String(balance.liquid),
    liquidUnconfirmed: String(balance.liquidUnconfirmed),
    locked: String(balance.locked),
    total: String(balance.total),
    unconfirmedTotal: String(balance.unconfirmedTotal),
  });

  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
    refetch: balanceRefetch,
  } = useQuery<IBalanceQueryResult>(GET_BALANCE, {
    variables: {
      publicKey: address,
      notifyOnNetworkStatusChange: true,
    },
    fetchPolicy: 'network-only',
    skip: !address,
    pollInterval: DEFAULT_QUERY_REFRESH_INTERVAL,
    onCompleted: data => {
      if (addBalance && data?.accountByKey?.balance) {
        addBalance(address, formatBalanceForContext(data.accountByKey.balance));
      }
    },
  });

  useEffect(() => {
    const refetchBalance = async (newAddress?: string) => {
      if (shouldBalanceUpdate) {
        await balanceRefetch({publicKey: newAddress || address});
        if (setShouldBalanceUpdate) {
          setShouldBalanceUpdate(false);
        }
      }
    };
    refetchBalance();
  }, [shouldBalanceUpdate, balanceRefetch, address, setShouldBalanceUpdate]);

  useEffect(() => {
    // If balance is available set it inside the component state and the balance context
    if (balanceData?.accountByKey?.balance) {
      if (setBalanceContext && addBalance) {
        addBalance(address, formatBalanceForContext(balanceData.accountByKey.balance));
      }
    }
  }, [balanceData, addBalance, setBalanceContext, address]);

  const storedUserBalance =
    (balance?.balances[address] && balance?.balances[address].unconfirmedTotal) || 0;
  const userBalance =
    Number(balanceData?.accountByKey?.balance?.unconfirmedTotal) ||
    Number(storedUserBalance) ||
    0;

  return {
    address,
    tickerData,
    tickerLoading,
    tickerError,
    balanceData,
    balanceLoading,
    balanceError,
    userBalance,
  };
};
