import {createContext, useState, useEffect, useCallback, useMemo} from 'react';
import type {ReactNode} from 'react';
import {IBalanceContext} from './BalanceTypes';
const initialBalance = {
  liquid: '0',
  liquidUnconfirmed: '0',
  locked: '0',
  total: '0',
  unconfirmedTotal: '0',
};

export interface IBalance {
  liquid: string;
  liquidUnconfirmed: string;
  locked: string;
  total: string;
  unconfirmedTotal: string;
}

interface IProps {
  children: ReactNode;
}

export interface IBalanceData {
  balances: {[address: string]: IBalance};
}

export const BalanceContext = createContext<Partial<IBalanceContext>>({});

export const BalanceContextProvider = (props: IProps) => {
  const [shouldBalanceUpdate, setShouldBalanceUpdate] = useState<boolean>(false);
  const [balanceData, setBalanceData] = useState<IBalanceData>({
    balances: {}, // Initialize balances as an empty object
  });

  // Load balances from localStorage on initialization
  useEffect(() => {
    const storedBalances = localStorage.getItem('balances');
    if (storedBalances) {
      setBalanceData({balances: JSON.parse(storedBalances)});
    }
  }, []);

  const setBalanceContext = useCallback((address: string, balance: IBalance) => {
    setBalanceData(prevData => {
      const updatedBalances = {...prevData.balances};
      updatedBalances[address] = balance;
      // Save balances to localStorage
      localStorage.setItem('balances', JSON.stringify(updatedBalances));
      return {balances: updatedBalances};
    });
  }, []);

  const getBalance = useCallback(
    (address: string) => {
      return balanceData.balances[address];
    },
    [balanceData.balances],
  );

  const addBalance = useCallback((address: string, balance: IBalance) => {
    setBalanceData(prevData => {
      const updatedBalances = {...prevData.balances};

      updatedBalances[address] = balance;

      // Save balances to localStorage
      localStorage.setItem('balances', JSON.stringify(updatedBalances));
      return {balances: updatedBalances};
    });
  }, []);

  const removeBalance = useCallback((address: string) => {
    setBalanceData(prevData => {
      const updatedBalances = {...prevData.balances};
      delete updatedBalances[address];
      // Save balances to localStorage
      localStorage.setItem('balances', JSON.stringify(updatedBalances));
      return {balances: updatedBalances};
    });
  }, []);

  const balanceContextValue = useMemo(
    () => ({
      shouldBalanceUpdate,
      balanceData,
      getBalance: (address: string) => balanceData.balances[address] || initialBalance, // Return initialBalance if the address is not found
      setBalanceContext,
      addBalance,
      removeBalance,
      setShouldBalanceUpdate,
    }),
    [shouldBalanceUpdate, balanceData, setBalanceContext, addBalance, removeBalance],
  );

  return (
    <BalanceContext.Provider value={balanceContextValue}>{props.children}</BalanceContext.Provider>
  );
};

export const {Consumer} = BalanceContext;
