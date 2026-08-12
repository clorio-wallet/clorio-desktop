import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import Avatar from '../../tools/avatar/avatar';
import {renderBalance, userBalanceToSymbolValue} from './BalanceHelper';
import {balanceTooltip} from './util';
import CustomSkeleton from '../CustomSkeleton';
import {useElementWidth, useBalanceData} from './BalanceHooks';
import AddressInfo from './AddressInfo';
import './Balance.scss';

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

  const {ref: containerRef, width: containerWidth} = useElementWidth(300);

  const btcValue = userBalanceToSymbolValue({
    tickerData,
    tickerLoading,
    userBalance,
    symbol: 'BTC',
    ticker: 'BTCMINA',
  });

  const usdtValue = userBalanceToSymbolValue({
    tickerData,
    tickerLoading,
    userBalance,
    symbol: 'USDT',
    ticker: 'USDTMINA',
  });

  return (
    <div className="balance-card glass-card">
      <ReactTooltip multiline={true} />
      
      <div 
        className="balance-card__inner"
        ref={containerRef}
      >
        <div className="balance-card__avatar">
          <CustomSkeleton
            show={!!address}
            altProps={{height: 64, width: 64, circle: true} as any}
          >
            <div className="balance-card__avatar-ring">
              <Avatar
                address={address}
                size={56}
              />
            </div>
          </CustomSkeleton>
        </div>

        <div className="balance-card__content">
          <AddressInfo
            address={address}
            width={containerWidth > 600 ? 320 : containerWidth > 400 ? 200 : 160}
            iconSize={14}
          />

          <div className="balance-card__stats">
            <div className="balance-stat">
              <span className="balance-stat__label">Balance</span>
              <div className="balance-stat__value">
                <CustomSkeleton
                  show={(!balanceLoading && !!balanceData) || !!balanceError}
                  altProps={{height: 24, width: 120}}
                >
                  <span 
                    data-tip={balanceTooltip(balanceData)}
                    className="animate__animated animate__fadeIn"
                  >
                    {balanceError ? 'Not available' : renderBalance({balanceData, balanceLoading, userBalance})}
                  </span>
                </CustomSkeleton>
              </div>
            </div>

            <div className="balance-stat-divider" />

            <div className="balance-stat">
              <span className="balance-stat__label">BTC Value</span>
              <div className="balance-stat__value">
                <CustomSkeleton
                  show={(!tickerLoading && !!tickerData) || !!tickerError}
                  altProps={{height: 24, width: 80}}
                >
                  <span className="animate__animated animate__fadeIn">
                    {tickerError ? '—' : btcValue}
                  </span>
                </CustomSkeleton>
              </div>
            </div>

            <div className="balance-stat-divider" />

            <div className="balance-stat">
              <span className="balance-stat__label">USD Value</span>
              <div className="balance-stat__value">
                <CustomSkeleton
                  show={(!tickerLoading && !!tickerData) || !!tickerError}
                  altProps={{height: 24, width: 80}}
                >
                  <span className="animate__animated animate__fadeIn">
                    {tickerError ? '—' : usdtValue}
                  </span>
                </CustomSkeleton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Balance;
