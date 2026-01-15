import * as React from 'react';
import CustomSkeleton from '../CustomSkeleton';
import {balanceTooltip} from './util';
import {IBalanceQueryResult} from './BalanceTypes';

interface IBalanceItemProps {
  label: string;
  loading: boolean;
  data: IBalanceQueryResult | undefined;
  error: any;
  value: React.ReactNode;
  centered?: boolean;
  headingTag?: 'h5' | 'h6';
  className?: string;
}

const BalanceItem = ({
  label,
  loading,
  data,
  error,
  value,
  centered,
  headingTag = 'h5',
  className = '',
}: IBalanceItemProps) => {
  const Heading = headingTag;
  return (
    <div
      className={`inline-block-element ${
        centered ? 'text-center w-100' : ''
      } ${className}`}
    >
      {/* <span> wrapper was present in some original code but maybe not needed if div handles it */}
      <h6 className={`secondaryText ${centered ? 'text-center' : ''}`}>{label}</h6>
      <CustomSkeleton
        show={(!loading && !!data) || !!error}
        altProps={{height: 20, width: 150}}
      >
        <Heading
          data-tip={balanceTooltip(data)}
          className={`animate__animated animate__fadeIn ${centered ? 'text-center' : ''}`}
        >
          {error ? 'Not available' : value}
        </Heading>
      </CustomSkeleton>
    </div>
  );
};

export default BalanceItem;
