import {useQuery} from '@apollo/client';
import {useCallback, useContext, useEffect, useState} from 'react';
import NewsBanner from '../components/UI/NewsBanner';
import Hoc from '../components/UI/Hoc';
import TransactionsTable from '../components/transactionsTable/TransactionsTable';
import type {
  IMempoolQueryResult,
  ITransactionQueryResult,
} from '../components/transactionsTable/TransactionsTypes';
import {BalanceContext} from '/@/contexts/balance/BalanceContext';
import type {IBalanceContext} from '/@/contexts/balance/BalanceTypes';
import {GET_HOME_NEWS, GET_ID, GET_MEMPOOL, GET_TRANSACTIONS} from '/@/graphql/query';
import {useWallet} from '../contexts/WalletContext';
import {
  DEFAULT_QUERY_REFRESH_INTERVAL,
  getPageFromOffset,
  readSession,
  TRANSACTIONS_TABLE_ITEMS_PER_PAGE,
} from '/@/tools';
import {IWalletIdData} from '../types';
import type {IHomeNewsQuery} from '/@/types/NewsData';
import type {IWalletData} from '/@/types/WalletData';

interface IProps {
  sessionData: IWalletData;
}

const Overview = ({sessionData}: IProps) => {
  const {balanceData} = useContext<Partial<IBalanceContext>>(BalanceContext);
  const balance = balanceData?.balances?.[sessionData.address];
  const {wallet, updateWallet: updateWalletState} = useWallet();
  const {id, address} = wallet;
  const [offset, setOffset] = useState<number>(0);
  const [walletId, setWalletId] = useState<number>(+sessionData.id);
  const [loading, setLoading] = useState(true);
  
  const {data: newsData} = useQuery<IHomeNewsQuery>(GET_HOME_NEWS);
  
  const {data: walletIDData} = useQuery<IWalletIdData>(GET_ID, {
    variables: {
      publicKey: address,
    },
    skip: !address,
  });

  const lastNews = newsData?.newsHome && newsData?.newsHome.length > 0 && newsData?.newsHome[0];

  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: transactionsRefetch,
    stopPolling: transactionStopPolling,
    startPolling: transactionStartPolling,
  } = useQuery<ITransactionQueryResult>(GET_TRANSACTIONS, {
    variables: {accountId: +id || walletId, offset},
    fetchPolicy: 'network-only',
    skip: !id && walletId === -1,
    pollInterval: DEFAULT_QUERY_REFRESH_INTERVAL,
  });

  const {
    data: mempoolData,
    loading: mempoolLoading,
    refetch: mempoolRefetch,
    stopPolling: mempoolStopPolling,
    startPolling: mempoolStartPolling,
  } = useQuery<IMempoolQueryResult>(GET_MEMPOOL, {
    variables: {publicKey: sessionData.address},
    skip: !sessionData.address,
    fetchPolicy: 'network-only',
    pollInterval: DEFAULT_QUERY_REFRESH_INTERVAL,
  });

  const readWalletData = useCallback(async () => {
    const sessionWallet = await readSession();
    if (sessionWallet && sessionWallet.id !== -1 && sessionWallet.id !== walletId) {
      setWalletId(sessionWallet.id);
    }
  }, [walletId]);

  useEffect(() => {
    if (walletId !== -1) return;
    
    const interval = setInterval(() => {
      readWalletData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [walletId]);

  useEffect(() => {
    if (walletIDData?.idByPublicKey) {
      const newId = walletIDData.idByPublicKey.id;
      
      if (newId !== null && newId !== id) {
        updateWalletState({id: newId});
      } else if (newId === null && id !== -1) {
        updateWalletState({id: -1});
      }
    }
  }, [walletIDData, id, updateWalletState]);

  const changeOffset = (page: number) => {
    setLoading(true);
    const data = (page - 1) * TRANSACTIONS_TABLE_ITEMS_PER_PAGE;
    setOffset(data);
  };

  const refetchData = (refetch = false) => {
    transactionStopPolling();
    mempoolStopPolling();
    if (refetch) {
      mempoolRefetch();
      transactionsRefetch();
    }
    setTimeout(() => {
      transactionStartPolling(DEFAULT_QUERY_REFRESH_INTERVAL);
      mempoolStartPolling(DEFAULT_QUERY_REFRESH_INTERVAL);
    }, 500);
  };

  useEffect(() => {
    if (transactionsData || mempoolData || transactionsError) {
      setLoading(false);
    }
  }, [transactionsData, mempoolData, transactionsError]);

  const currentBalance = balance?.total ? +balance.total : 0;

  return (
    <Hoc className="main-container overview-container">
      <div>
        {lastNews && <NewsBanner {...lastNews} />}
        <TransactionsTable
          transactions={transactionsData}
          mempool={mempoolData}
          error={transactionsError}
          loading={loading || transactionsLoading || mempoolLoading}
          balance={currentBalance}
          setOffset={changeOffset}
          page={getPageFromOffset(offset)}
          userId={+id || walletId}
          userAddress={sessionData.address}
          refetchData={refetchData}
        />
      </div>
    </Hoc>
  );
};

export default Overview;
