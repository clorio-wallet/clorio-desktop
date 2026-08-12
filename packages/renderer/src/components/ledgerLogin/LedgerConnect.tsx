import {useState, useEffect} from 'react';
import Input from '../UI/input/Input';
import Button from '../UI/Button';
import LedgerGetAddress from './LedgerGetAddress';
import HelpHint from '../UI/HelpHint';
import {toast} from 'react-toastify';
import {
  IS_LEDGER_OPEN_TIME_DELAY,
  MINIMUM_LEDGER_ACCOUNT_NUMBER,
  MAXIMUM_LEDGER_ACCOUNT_NUMBER,
} from '../../tools';
import LedgerIncompatible from './LedgerIncopatible';
import LedgerSearch from './LedgerSearch';
import ReactTooltip from 'react-tooltip';
import {ArrowLeft, ArrowRight, CheckCircle} from 'react-feather';
import {isMinaAppOpen} from '/@/tools/ledger/ledger';

interface IProps {
  accountNumber?: number;
  toggleLoader: () => void;
}

const LedgerConnect = (props: IProps) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [customAccount, setCustomAccount] = useState<boolean>(false);
  const [accountNumber, setAccountNumber] = useState<number>(0);
  const [proceedToLedger, setProceedToLedger] = useState<boolean>(false);
  const [browserIncompatible, setBrowserIncompatible] = useState<boolean>(false);

  useEffect(() => {
    const timerCheck = setInterval(() => checkLedgerMinaAppOpen(), IS_LEDGER_OPEN_TIME_DELAY);
    return () => {
      clearInterval(timerCheck);
    };
  }, []);

  const checkLedgerMinaAppOpen = async () => {
    try {
      const open = await isMinaAppOpen();
      setIsAvailable(open);
    } catch (e: any) {
      setIsAvailable(false);
      if (e.message?.includes('not supported')) {
        setBrowserIncompatible(true);
      }
    }
  };

  const accountNumberHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const number = +event.target.value || MINIMUM_LEDGER_ACCOUNT_NUMBER;
    setAccountNumber(number);
  };

  const verifyAccountNumber = () => {
    if (
      +accountNumber >= MINIMUM_LEDGER_ACCOUNT_NUMBER &&
      +accountNumber <= MAXIMUM_LEDGER_ACCOUNT_NUMBER
    ) {
      setProceedToLedger(true);
    } else {
      toast.error(
        `Account number should be between ${MINIMUM_LEDGER_ACCOUNT_NUMBER} and ${MAXIMUM_LEDGER_ACCOUNT_NUMBER}`,
      );
    }
  };

  const renderAccountNumberSelect = (
    <div className="ledger-page animate__animated animate__fadeIn">
      {/* ── Header ── */}
      <div className="oi-header">
        <h1 className="oi-title">Ledger Connected</h1>
        <p className="oi-description">
          Please select your account number to continue. Default is 0.
        </p>
      </div>

      <div className="ledger-connection-status mt-4">
        <CheckCircle width={18} height={18} />
        Ledger device detected
      </div>

      <div className="mx-auto w-100 max-width-320 my-5">
        {customAccount ? (
          <div className="animate__animated animate__fadeInUp">
            <h6 className="full-width-align-center my-2 text-white opacity-80 flex-center gap-2">
              Select account number{' '}
              <HelpHint hint="Default account number is 0. If you have created your wallet with another account index, change it here.<br/> Only change this number if you know what you are doing." />
            </h6>
            <div className="mt-4">
              <Input
                type="number"
                value={accountNumber}
                inputHandler={accountNumberHandler}
              />
            </div>
            <ReactTooltip multiline />
          </div>
        ) : (
          <div className="ledger-custom-account">
             <button 
              className="ledger-custom-account-btn"
              onClick={() => setCustomAccount(true)}
            >
              Select a custom account index
            </button>
          </div>
        )}
      </div>

      <div className="oi-footer-row mt-auto w-100">
        <div className="oi-actions oi-actions--wide mx-auto">
          <Button
            className="oi-back"
            text="Back"
            icon={<ArrowLeft />}
            link="/login-selection"
            style="quiet"
            disableHoverStyle
          />
          <Button
            onClick={verifyAccountNumber}
            text="Continue"
            style="primary"
            icon={<ArrowRight />}
            appendIcon
          />
        </div>
      </div>
    </div>
  );

  if (proceedToLedger) {
    return (
      <LedgerGetAddress
        {...props}
        accountNumber={accountNumber}
      />
    );
  }

  const content = browserIncompatible ? (
    <LedgerIncompatible />
  ) : isAvailable ? (
    renderAccountNumberSelect
  ) : (
    <LedgerSearch />
  );

  return (
    <div className="w-100 flex-center">
      {content}
    </div>
  );
};

export default LedgerConnect;
