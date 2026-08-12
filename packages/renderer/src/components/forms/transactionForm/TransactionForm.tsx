import {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import {toNanoMINA, toLongMINA, toMINA} from '../../../tools';
import Button from '../../UI/Button';
import Input from '../../UI/input/Input';
import {toast} from 'react-toastify';
import type {ITransactionData} from '../../../types/TransactionData';
import {checkFieldsAndProceed} from './TransactionFormHelper';
import type {IBalanceData} from '../../../contexts/balance/BalanceTypes';
import {ArrowRight, AlertCircle, CheckCircle, AlertTriangle, Loader} from 'react-feather';
import {useRecoilValue, useSetRecoilState} from 'recoil';
import {deeplinkState} from '/@/store';

interface IProps {
  transactionData: ITransactionData;
  averageFee: number;
  fastFee: number;
  setData: (transactionData: ITransactionData) => void;
  nextStep: () => void;
  balance?: IBalanceData;
}

interface IValidationState {
  address: 'idle' | 'valid' | 'invalid';
  amount: 'idle' | 'valid' | 'invalid' | 'warning';
  message: string;
}

const MAX_MEMO_LENGTH = 32;
const MAX_ADDRESS_LENGTH = 55;
const MIN_FEE = 0.00001;
const MAX_AMOUNT_DISPLAY = 999999999999;

function sanitizeNumber(value: string): string {
  return value
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1')
    .replace(/^0+(\d)/, '$1');
}

function safeToNanoMINA(value: number | string): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return 0;
  return toNanoMINA(num);
}

function safeToLongMINA(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0';
  if (value > MAX_AMOUNT_DISPLAY) return `>${MAX_AMOUNT_DISPLAY.toLocaleString()}`;
  return toLongMINA(value);
}

function formatMaxDecimals(value: number | string, maxDecimals: number = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return '0';
  return num.toLocaleString(undefined, {
    maximumFractionDigits: maxDecimals,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DebouncedFunc<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
): DebouncedFunc<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const TransactionForm = ({
  transactionData,
  averageFee,
  fastFee,
  setData,
  nextStep,
  balance,
}: IProps) => {
  const [amount, setAmount] = useState<number | string>(toLongMINA(transactionData.amount));
  const [fee, setFee] = useState<number | string>(toLongMINA(transactionData.fee));
  const [selectedFeePreset, setSelectedFeePreset] = useState<'avg' | 'fast' | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [validation, setValidation] = useState<IValidationState>({
    address: 'idle',
    amount: 'idle',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSetDataRef = useRef<ReturnType<typeof debounce> | null>(null);
  const deeplinkData = useRecoilValue(deeplinkState);
  const setDeeplinkData = useSetRecoilState(deeplinkState);

  const availableBalance = useMemo(() => {
    const raw = balance?.liquidUnconfirmed;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 0;
    return isNaN(num) || !isFinite(num) ? 0 : num;
  }, [balance?.liquidUnconfirmed]);

  const totalToSend = useMemo(() => {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    const feeNum = typeof fee === 'string' ? parseFloat(fee) || 0 : fee;
    if (isNaN(amountNum) || isNaN(feeNum)) return 0;
    return safeToNanoMINA(amountNum + feeNum);
  }, [amount, fee]);

  const remainingBalance = useMemo(() => {
    return availableBalance - totalToSend;
  }, [availableBalance, totalToSend]);

  const impactPercentage = useMemo(() => {
    if (availableBalance <= 0 || isNaN(availableBalance)) return 0;
    if (totalToSend <= 0) return 0;
    return Math.min((totalToSend / availableBalance) * 100, 100);
  }, [availableBalance, totalToSend]);

  const displayAmount = useMemo(() => {
    const amountNum = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    if (isNaN(amountNum)) return 0;
    return amountNum;
  }, [amount]);

  const validateAddress = useCallback((address: string): boolean => {
    if (!address || typeof address !== 'string') return false;
    const trimmed = address.trim();
    if (!trimmed) return false;
    if (!trimmed.startsWith('B62')) return false;
    if (trimmed.length < 50 || trimmed.length > MAX_ADDRESS_LENGTH) return false;
    return true;
  }, []);

  const validateAmount = useCallback(
    (value: number | string): {valid: boolean; warning: boolean; message: string} => {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      if (isNaN(numValue) || numValue <= 0) {
        return {valid: false, warning: false, message: 'Enter an amount greater than 0'};
      }
      if (numValue > MAX_AMOUNT_DISPLAY) {
        return {
          valid: false,
          warning: false,
          message: `Amount exceeds maximum (${MAX_AMOUNT_DISPLAY.toLocaleString()})`,
        };
      }
      const nanoValue = safeToNanoMINA(numValue);
      if (nanoValue + transactionData.fee > availableBalance) {
        return {valid: false, warning: false, message: 'Insufficient balance'};
      }
      if (availableBalance > 0 && nanoValue + transactionData.fee > availableBalance * 0.95) {
        return {
          valid: true,
          warning: true,
          message: 'This will leave less than 5% of your balance',
        };
      }
      return {valid: true, warning: false, message: ''};
    },
    [availableBalance, transactionData.fee],
  );

  const debouncedSetData = useCallback((updates: Partial<ITransactionData>) => {
    if (debouncedSetDataRef.current) {
      debouncedSetDataRef.current(updates);
    }
  }, []);

  useEffect(() => {
    debouncedSetDataRef.current = debounce((updates: Partial<ITransactionData>) => {
      setData({...transactionData, ...updates});
    }, 150);
  }, [setData, transactionData]);

  useEffect(() => {
    if (deeplinkData?.data?.amount) {
      const sanitizedAmount = sanitizeNumber(String(deeplinkData.data.amount));
      const parsedAmount = parseFloat(sanitizedAmount);
      if (!isNaN(parsedAmount) && isFinite(parsedAmount)) {
        setAmount(parsedAmount);
        setData({
          ...transactionData,
          amount: safeToNanoMINA(parsedAmount),
          fee: deeplinkData.data.fee ? safeToNanoMINA(deeplinkData.data.fee) : transactionData.fee,
        });
        if (deeplinkData.data.fee) {
          setFee(deeplinkData.data.fee);
        }
      }
      setDeeplinkData({type: '', data: {}});
    }
  }, [deeplinkData, setData, transactionData]);

  useEffect(() => {
    if (focusedField === 'address') {
      const isValid = transactionData.receiverAddress
        ? validateAddress(transactionData.receiverAddress)
        : false;
      const isInvalid =
        transactionData.receiverAddress && !validateAddress(transactionData.receiverAddress);
      setValidation(prev => ({
        ...prev,
        address: !transactionData.receiverAddress ? 'idle' : isValid ? 'valid' : 'invalid',
        message: isInvalid ? 'Invalid Mina address (must start with B62, 50+ chars)' : prev.message,
      }));
    }
  }, [transactionData.receiverAddress, focusedField, validateAddress]);

  useEffect(() => {
    if (focusedField === 'amount') {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
      if (isNaN(numAmount)) {
        setValidation(prev => ({...prev, amount: 'idle', message: ''}));
        return;
      }
      const result = validateAmount(numAmount);
      setValidation(prev => ({
        ...prev,
        amount: result.valid ? (result.warning ? 'warning' : 'valid') : 'invalid',
        message: result.message,
      }));
    }
  }, [amount, focusedField, validateAmount]);

  const setFeeHandler = (selectedFee: string | number, preset?: 'avg' | 'fast') => {
    const sanitized = typeof selectedFee === 'string' ? sanitizeNumber(selectedFee) : selectedFee;
    const numFee = typeof sanitized === 'string' ? parseFloat(sanitized) || 0 : sanitized;
    if (isNaN(numFee) || numFee < MIN_FEE) return;
    setFee(numFee);
    setSelectedFeePreset(preset || null);
    debouncedSetData({fee: safeToNanoMINA(numFee)});
  };

  const addressHandler = (value: string) => {
    const sanitized = value.replace(/[<>{}]/g, '').slice(0, MAX_ADDRESS_LENGTH);
    setData({...transactionData, receiverAddress: sanitized});
  };

  const amountHandler = (value: string) => {
    const sanitized = sanitizeNumber(value);
    const numValue = parseFloat(sanitized) || 0;
    setAmount(numValue);
    debouncedSetData({amount: safeToNanoMINA(numValue)});
  };

  const memoHandler = (value: string) => {
    const sanitized = value.slice(0, MAX_MEMO_LENGTH);
    if (value.length > MAX_MEMO_LENGTH) {
      toast.error(`Memo limited to ${MAX_MEMO_LENGTH} characters`);
    }
    setData({...transactionData, memo: sanitized});
  };

  const setAllFunds = () => {
    if (availableBalance <= 0) {
      toast.error('No balance available');
      return;
    }
    const currentFee = transactionData.fee || safeToNanoMINA(fee);
    if (availableBalance - currentFee <= 0) {
      toast.error('Please select a lower fee');
      return;
    }
    const maxAmount = availableBalance - currentFee;
    const displayAmount = Math.max(0, parseFloat(safeToLongMINA(maxAmount)) || 0);
    amountHandler(displayAmount.toString());
    toast.success('Maximum amount set');
  };

  const setHalfFunds = () => {
    if (availableBalance <= 0) {
      toast.error('No balance available');
      return;
    }
    const currentFee = transactionData.fee || safeToNanoMINA(fee);
    if (availableBalance - currentFee <= 0) {
      toast.error('Please select a lower fee');
      return;
    }
    const halfAmount = (availableBalance - currentFee) / 2;
    const displayAmount = Math.max(0, parseFloat(safeToLongMINA(halfAmount)) || 0);
    amountHandler(displayAmount.toString());
  };

  const handleAddressBlur = () => setFocusedField(null);
  const handleAmountBlur = () => setFocusedField(null);
  const handleAddressFocus = () => setFocusedField('address');
  const handleAmountFocus = () => setFocusedField('amount');

  const getValidationState = () => {
    if (validation.amount === 'invalid' || validation.address === 'invalid') {
      return {className: 'error', icon: <AlertCircle className="tx-validation-icon" />};
    }
    if (validation.amount === 'warning') {
      return {className: 'warning', icon: <AlertTriangle className="tx-validation-icon" />};
    }
    if (validation.amount === 'valid' || validation.address === 'valid') {
      return {className: 'success', icon: <CheckCircle className="tx-validation-icon" />};
    }
    return {className: '', icon: null};
  };

  const addressValidationState = transactionData.receiverAddress ? validation.address : 'idle';
  const addressStatusIcon =
    addressValidationState === 'invalid' ? (
      <AlertCircle className="tx-address-status-icon tx-address-status-icon--error" />
    ) : addressValidationState === 'valid' ? (
      <CheckCircle className="tx-address-status-icon tx-address-status-icon--success" />
    ) : null;

  const handleSubmit = async () => {
    if (validation.amount === 'invalid' || validation.address === 'invalid') {
      toast.error('Please fix the errors before submitting');
      return;
    }
    setIsLoading(true);
    try {
      await checkFieldsAndProceed(transactionData, nextStep);
    } finally {
      setIsLoading(false);
    }
  };

  const isBalanceLoading = balance === undefined;
  const displayBalance = toMINA(availableBalance).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
  const displayTotal = formatMaxDecimals(toLongMINA(totalToSend));
  const displayRemaining = formatMaxDecimals(toLongMINA(Math.max(remainingBalance, 0)));
  const displayFee = formatMaxDecimals(typeof fee === 'string' ? parseFloat(fee) || 0 : fee);

  return (
    <div className="tx-form-container">
      <div className="tx-form-layout">
        <div className="tx-form-main tx-card">
          <div className="tx-form-section">
            <label
              className="tx-form-label"
              htmlFor="recipient-address"
            >
              Recipient
              <span>
                <div className="tx-validation-slot tx-validation-slot--persistent">
                  {validation.address === 'invalid' && (
                    <div
                      className="tx-validation-msg tx-validation-msg--error"
                      role="alert"
                    >
                      <AlertCircle className="tx-validation-icon" />
                      <span>{validation.message}</span>
                    </div>
                  )}
                  {transactionData.receiverAddress && validation.address === 'valid' && (
                    <div
                      className="tx-validation-msg tx-validation-msg--success"
                      role="status"
                    >
                      <span>Address looks valid</span>
                    </div>
                  )}
                </div>
              </span>
            </label>
            <div className="tx-form-input-with-copy">
              <Input
                id="recipient-address"
                value={transactionData.receiverAddress}
                placeholder="B62... address"
                inputHandler={e => addressHandler(e.currentTarget.value)}
                inputFocusHandler={handleAddressFocus}
                inputBlurHandler={handleAddressBlur}
                appendIcon={addressStatusIcon}
              />
            </div>
          </div>

          <div className="tx-form-section tx-form-section--compact">
            <label
              className="tx-form-label"
              htmlFor="memo"
            >
              Memo
              <span className="tx-form-optional">optional</span>
            </label>
            <div className="tx-form-memo-wrapper">
              <Input
                id="memo"
                value={transactionData.memo}
                placeholder="Add a note"
                inputHandler={e => memoHandler(e.currentTarget.value)}
              />
              <span
                className="tx-memo-counter"
                aria-live="polite"
              >
                {transactionData.memo?.length || 0}/{MAX_MEMO_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <div className="tx-form-section">
              <div className="tx-form-label-row">
                <label
                  className="tx-form-label"
                  htmlFor="amount"
                >
                  Amount
                </label>
                <div className="tx-form-quick-actions">
                  <button
                    className="tx-form-quick-btn"
                    onClick={setHalfFunds}
                    type="button"
                    disabled={availableBalance <= 0}
                  >
                    Half
                  </button>
                  <button
                    className="tx-form-quick-btn"
                    onClick={setAllFunds}
                    type="button"
                    disabled={availableBalance <= 0}
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="tx-form-input-wrapper">
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  inputHandler={e => amountHandler(e.target.value)}
                  inputFocusHandler={handleAmountFocus}
                  inputBlurHandler={handleAmountBlur}
                  type="number"
                />
              </div>
              {validation.amount !== 'idle' && validation.amount !== 'valid' && (
                <div
                  className={`tx-validation-msg tx-validation-msg--${getValidationState().className}`}
                  role="alert"
                >
                  {getValidationState().icon}
                  <span>{validation.message}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="tx-form-section">
              <div className="tx-form-label-row">
                <label
                  className="tx-form-label"
                  htmlFor="fee"
                >
                  Fee
                </label>
                <div className="tx-form-quick-actions">
                  <button
                    className={`tx-form-quick-btn ${selectedFeePreset === 'avg' ? 'active' : ''}`}
                    onClick={() => setFeeHandler(averageFee, 'avg')}
                    type="button"
                  >
                    <span className="tx-form-fee-label">Avg</span>
                  </button>
                  <button
                    className={`tx-form-quick-btn ${selectedFeePreset === 'fast' ? 'active' : ''}`}
                    onClick={() => setFeeHandler(fastFee, 'fast')}
                    type="button"
                  >
                    <span className="tx-form-fee-label">Fast</span>
                  </button>
                </div>
              </div>
              <div className="tx-form-input-wrapper">
                <Input
                  id="fee"
                  placeholder="Custom"
                  value={fee}
                  inputHandler={e => setFeeHandler(e.target.value)}
                  type="number"
                />
              </div>
            </div>
          </div>

          <div className="tx-form-submit">
            <Button
              onClick={handleSubmit}
              text={isLoading ? 'Processing...' : 'Review Transaction'}
              style="primary"
              icon={isLoading ? <Loader className="tx-spinner" /> : <ArrowRight />}
              appendIcon={!isLoading}
              disabled={
                isLoading || validation.amount === 'invalid' || validation.address === 'invalid'
              }
            />
          </div>
        </div>

        <div
          className="tx-form-sidebar"
          aria-label="Balance preview"
        >
          <div className="tx-balance-panel">
            <div className="tx-balance-panel__header">
              <span className="tx-balance-panel__title">Balance Preview</span>
              {isBalanceLoading ? (
                <span className="tx-balance-panel__loading">
                  <Loader className="tx-spinner tx-spinner--small" />
                </span>
              ) : (
                <span className="tx-balance-panel__available">
                  <span className="tx-balance-value">{displayBalance}</span>
                  <span className="tx-balance-panel__unit">MINA</span>
                </span>
              )}
            </div>

            <div className="tx-balance-panel__impact">
              <div className="tx-impact-header">
                <span className="tx-impact-label">Transaction Impact</span>
                <span
                  className={`tx-impact-percent ${impactPercentage > 80 ? 'tx-impact-percent--high' : ''}`}
                  aria-live="polite"
                >
                  {isNaN(impactPercentage) ? '0.0' : impactPercentage.toFixed(1)}%
                </span>
              </div>

              <div
                className={`tx-impact-bar ${impactPercentage > 95 ? 'tx-impact-bar__critical' : impactPercentage > 80 ? 'tx-impact-bar__warning' : ''}`}
                role="progressbar"
                aria-valuenow={Math.round(impactPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Balance impact percentage"
              >
                <div
                  className="tx-impact-bar__current"
                  style={{
                    width: `${isNaN(impactPercentage) ? 0 : Math.min(impactPercentage, 100)}%`,
                  }}
                />
              </div>

              <div className="tx-impact-breakdown">
                <div className="tx-impact-line">
                  <span className="tx-impact-line__label">Amount</span>
                  <span className="tx-impact-line__value">
                    {displayAmount.toLocaleString(undefined, {maximumFractionDigits: 4})}
                  </span>
                </div>
                <div className="tx-impact-line">
                  <span className="tx-impact-line__label">Fee</span>
                  <span className="tx-impact-line__value">{displayFee}</span>
                </div>
                <div className="tx-impact-line tx-impact-line--total">
                  <span className="tx-impact-line__label">Total</span>
                  <span className="tx-impact-line__value tx-impact-line__value--out">
                    {displayTotal}
                  </span>
                </div>
              </div>

              <div className="tx-impact-divider" />

              <div className="tx-impact-result">
                <span className="tx-impact-result__label">Remaining</span>
                <span
                  className={`tx-impact-result__value ${remainingBalance < 0 ? 'tx-impact-result__value--negative' : 'tx-impact-result__value--positive'}`}
                  aria-live="polite"
                >
                  {displayRemaining}
                  <span className="tx-impact-result__unit">MINA</span>
                </span>
              </div>
            </div>

            {validation.amount === 'warning' && (
              <div
                className="tx-balance-panel__warning"
                role="alert"
              >
                <AlertTriangle
                  className="tx-warning-icon"
                  size={16}
                />
                <span>{validation.message}</span>
              </div>
            )}

            {remainingBalance < 0 && (
              <div
                className="tx-balance-panel__error"
                role="alert"
              >
                <AlertCircle
                  className="tx-error-icon"
                  size={16}
                />
                <span>Insufficient balance for this transaction</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
