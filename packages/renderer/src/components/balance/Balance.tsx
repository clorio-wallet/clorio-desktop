import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import Avatar from '../../tools/avatar/avatar';
import {renderBalance, userBalanceToSymbolValue} from './BalanceHelper';
import {balanceTooltip} from './util';
import CustomSkeleton from '../CustomSkeleton';
import {useElementWidth, useBalanceData} from './BalanceHooks';
import AddressInfo from './AddressInfo';
import BalanceItem from './BalanceItem';

const Balance = () => {
  const {
    address,
    tickerData,
    tickerLoading,
    tickerError,
    balanceData,
    balanceLoading,
    balanceError,
    userBalance,
  } = useBalanceData();

  const {ref: bigTextRef, width: widthBigText} = useElementWidth(150);
  const {ref: textRef, width: widthSmallText} = useElementWidth(150);

  return (
    <div className="glass-card px-3 py-2">
      <ReactTooltip multiline={true} />
      <div className="big-screen" ref={bigTextRef}>
        <div className="flex flex-row justify-start gap-4">
          <div className="inline-block-element mt-2">
            <CustomSkeleton
              show={!!address}
              altProps={{height: 75, width: 75, circle: true} as any}
            >
              <div className="walletImageOutline">
                <Avatar address={address} className="balance-avatar" />
              </div>
            </CustomSkeleton>
          </div>
          <div className="inline-block-element wallet-data flex gap-2 flex-col">
            <AddressInfo address={address} width={widthBigText} iconSize={20} />
            <div className="flex flex-row justify-start">
              <BalanceItem
                label="Your balance"
                loading={balanceLoading}
                data={balanceData}
                error={balanceError}
                value={renderBalance({balanceData, balanceLoading, userBalance})}
              />
              <div className="inline-block-element ml-2">
                <div className="v-div" />
              </div>
              <BalanceItem
                className="ml-2"
                label="BTC Apx. value"
                loading={tickerLoading}
                data={balanceData}
                error={tickerError}
                value={userBalanceToSymbolValue({
                  tickerData,
                  tickerLoading,
                  userBalance,
                  symbol: 'BTC',
                  ticker: 'BTCMINA',
                })}
              />
              <div className="inline-block-element ml-2">
                <div className="v-div" />
              </div>
              <BalanceItem
                className="ml-2"
                label="USDT Apx. value"
                loading={tickerLoading}
                data={balanceData}
                error={tickerError}
                value={userBalanceToSymbolValue({
                  tickerData,
                  tickerLoading,
                  userBalance,
                  symbol: 'USDT',
                  ticker: 'USDTMINA',
                })}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex flex-col w-full items-center small-screen"
        ref={textRef}
      >
        <div className="flex flex-row justify-start gap-4">
          <div className="inline-block-element mt-2">
            <CustomSkeleton
              show={!!address}
              altProps={{height: 75, width: 75, circle: true} as any}
            >
              <div className="walletImageOutline">
                <Avatar address={address} className="balance-avatar" size={60} />
              </div>
            </CustomSkeleton>
          </div>
          <div className="inline-block-element wallet-data flex gap-2 flex-col">
            <AddressInfo address={address} width={widthSmallText} iconSize={18} />
          </div>
        </div>
        <div>
          <div className="flex flex-row justify-between px-4 mt-4">
            <BalanceItem
              label="Your balance"
              loading={balanceLoading}
              data={balanceData}
              error={balanceError}
              value={renderBalance({balanceData, balanceLoading, userBalance})}
              centered
              headingTag="h6"
            />
            <div className="inline-block-element ml-2">
              <div className="v-div" />
            </div>
            <div className="inline-block-element ml-2 w-100">
              <BalanceItem
                label="BTC Apx. value"
                loading={tickerLoading}
                data={balanceData}
                error={tickerError}
                value={userBalanceToSymbolValue({
                  tickerData,
                  tickerLoading,
                  userBalance,
                  symbol: 'BTC',
                  ticker: 'BTCMINA',
                })}
                centered
                headingTag="h6"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Balance;
