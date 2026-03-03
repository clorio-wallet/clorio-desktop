import {createContext, useState} from 'react';
import type {ReactNode} from 'react';
import {MINIMUM_LEDGER_ACCOUNT_NUMBER} from '../../tools';
import type {ILedgerContext, ILedgerContextData} from './LedgerTypes';

interface IProps {
  children: ReactNode;
}

const initLedgerData: ILedgerContextData = {
  ledger: false,
  ledgerAccount: MINIMUM_LEDGER_ACCOUNT_NUMBER,
};

export const LedgerContext = createContext<Partial<ILedgerContext>>({});

export const LedgerContextProvider = (props: IProps) => {
  const [ledgerData, setLedgerData] = useState<ILedgerContextData>(initLedgerData);

  const setLedgerContext = (data: ILedgerContextData) => {
    setLedgerData(data);
  };

  const isLedgerEnabled = ledgerData.ledger;

  const ledgerDataContextValue = {
    isLedgerEnabled,
    ledgerData,
    setLedgerContext,
  };

  return (
    <LedgerContext.Provider value={ledgerDataContextValue}>{props.children}</LedgerContext.Provider>
  );
};

export const {Consumer} = LedgerContext;
