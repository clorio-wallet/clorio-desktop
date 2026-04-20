import * as React from 'react';
import {Copy} from 'react-feather';
import CustomSkeleton from '../CustomSkeleton';
import Truncate from 'react-truncate-inside';
import {copyToClipboard} from '../../tools';
import {toast} from 'react-toastify';

interface IAddressInfoProps {
  address: string;
  width: number;
  iconSize?: number;
}

const AddressInfo = ({address, width, iconSize = 16}: IAddressInfoProps) => {
  const handleCopy = () => {
    copyToClipboard(address);
    toast.success('Address copied to clipboard');
  };

  return (
    <div className="address-info">
      <div className="address-info__header">
        <span className="address-info__label">Wallet address</span>
        <button 
          className="address-info__copy"
          onClick={handleCopy}
          aria-label="Copy wallet address"
        >
          <Copy size={iconSize} />
        </button>
      </div>
      <CustomSkeleton 
        show={!!address} 
        altProps={{height: 20, width: Math.min(width || 300, 400)}}>
        <div className="address-info__value">
          <span className="selectable-text">
            <Truncate text={address} width={width || 300} />
          </span>
        </div>
      </CustomSkeleton>
    </div>
  );
};

export default AddressInfo;
