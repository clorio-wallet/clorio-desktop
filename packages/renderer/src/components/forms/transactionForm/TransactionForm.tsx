import {useEffect, useState} from 'react';
import {Row, Col} from 'react-bootstrap';
import {toNanoMINA, toLongMINA, toMINA} from '../../../tools';
import Button from '../../UI/Button';
import Input from '../../UI/input/Input';
import {toast} from 'react-toastify';
import type {ITransactionData} from '../../../types/TransactionData';
import {checkFieldsAndProceed} from './TransactionFormHelper';
import type {IBalanceData} from '../../../contexts/balance/BalanceTypes';
import Big from 'big.js';
import {ArrowRight} from 'react-feather';
import {useRecoilValue, useSetRecoilState} from 'recoil';
import {deeplinkState} from '/@/store';
import QRCodeGenerator from '../../QRCode/QRCodeGenerator';

interface IProps {
  transactionData: ITransactionData;
  averageFee: number;
  fastFee: number;
  setData: (transactionData: ITransactionData) => void;
  nextStep: () => void;
  balance?: IBalanceData;
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
  const deeplinkData = useRecoilValue(deeplinkState);
  const setDeeplinkData = useSetRecoilState(deeplinkState);

  /**
   * Effect to handle deeplink data.
   * If deeplink data contains amount and fee, set them in the state.
   */
  useEffect(() => {
    if (deeplinkData?.data?.amount) {
      amountHandler(deeplinkData.data.amount);
      setDeeplinkData({type: '', data: {}});
      if (deeplinkData.data.fee > 0) {
        setFeeHandler(deeplinkData.data.fee);
      }
    }
  }, [deeplinkData, setData, transactionData]);

  /**
   * If a fee button has been selected (average or fast) or a fee has been entered from the input
   * set it inside the transaction data block,
   * otherwise set the default fee.
   * @param selectedFee string
   */
  const setFeeHandler = (selectedFee: string | number) => {
    setFee(selectedFee);
    setData({
      ...transactionData,
      fee: toNanoMINA(selectedFee || 0),
    });
  };

  /**
   * Set the receiver address inside the transaction data block
   * @param receiverAddress string
   */
  const addressHandler = (receiverAddress: string) => {
    setData({
      ...transactionData,
      receiverAddress,
    });
  };

  /**
   * Set the amount inside the transaction data block
   * @param amount string
   */
  const amountHandler = (amount: string) => {
    setAmount(amount);
    setData({
      ...transactionData,
      amount: toNanoMINA(amount || 0),
    });
  };

  /**
   * Set the memo inside the transaction data block
   * @param memo string
   */
  const memoHandler = (memo: string) => {
    if (memo.length > 32) {
      toast.error('Memo is limited to 32 characters');
    } else {
      setData({
        ...transactionData,
        memo,
      });
    }
  };

  /**
   * Set the max amount based on the selected fee and the wallet balance
   * @returns max amount
   */
  const setAllFunds = () => {
    const fee = transactionData.fee;
    const available = balance?.liquidUnconfirmed || 0;
    if (+available > 0) {
      if (+Big(available).sub(fee) <= 0) {
        toast.error('Please select a lower fee');
        return;
      }
      const maxAmount = +Big(available).sub(fee);
      amountHandler(toLongMINA(maxAmount).toString());
    }
  };

  /**
   * Set the half amount based on the selected fee and the wallet balance
   * @returns max amount
   */
  const setHalfFunds = () => {
    const fee = transactionData.fee;
    const available = balance?.liquidUnconfirmed || 0;
    if (+available > 0) {
      if (+Big(available).sub(fee) <= 0) {
        toast.error('Please select a lower fee');
        return;
      }
      const maxAmount = +Big(available).sub(fee).div(2);
      amountHandler(toLongMINA(maxAmount).toString());
    }
  };

  const qrCodeUrl = `mina://send-tx?to=${transactionData.receiverAddress}&amount=${toMINA(
    transactionData.amount,
  )}&memo=${transactionData.memo}`;

  return (
    <div className="mx-auto w-75">
      <div className="my-5">
        <h3>Recipient</h3>
        <Input
          value={transactionData.receiverAddress}
          placeholder="Enter address "
          inputHandler={e => addressHandler(e.currentTarget.value)}
        />
        <h3>Memo</h3>
        <Input
          value={transactionData.memo}
          placeholder="Enter memo "
          inputHandler={e => memoHandler(e.currentTarget.value)}
        />
        <Row>
          <Col
            md={12}
            xl={6}
          >
            <div className="flex flex-row justify-between">
              <h3>Amount</h3>
              <div className="fee-label flex flex-row">
                <Button
                  className="link-button custom-delegate-button purple-text align-end  no-padding"
                  text="Half"
                  onClick={setHalfFunds}
                />
                <Button
                  className="link-button custom-delegate-button purple-text align-end  no-padding"
                  text="All"
                  onClick={setAllFunds}
                />
              </div>
            </div>
            <Input
              placeholder="Enter an amount "
              value={amount}
              inputHandler={e => amountHandler(e.target.value)}
              type="number"
            />
          </Col>
          <Col
            md={12}
            xl={6}
          >
            <div className="flex flex-row justify-between items-center">
              <h3 className="inline-element ">Fee</h3>
              <div className="fee-label flex flex-row">
                <Button
                  className="link-button custom-delegate-button purple-text align-end  no-padding"
                  text="Avg"
                  onClick={() => setFeeHandler(averageFee)}
                />
                <Button
                  className="link-button custom-delegate-button purple-text align-end  no-padding"
                  text="Fast"
                  onClick={() => setFeeHandler(fastFee)}
                />
              </div>
            </div>
            <Input
              placeholder="Enter a fee "
              value={fee}
              inputHandler={e => setFeeHandler(e.target.value)}
              type="number"
            />
          </Col>
        </Row>
        <div className="py-3 row w-full">
          <div className="w-50 col">
            <QRCodeGenerator
              url={qrCodeUrl}
              extended
            />
          </div>

          <Button
            onClick={() => checkFieldsAndProceed(transactionData, nextStep)}
            text="Preview"
            style="primary"
            className="w-50 col"
            icon={<ArrowRight />}
            appendIcon
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
