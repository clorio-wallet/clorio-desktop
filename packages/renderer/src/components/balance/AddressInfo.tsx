import * as React from 'react';
import {Row, Col} from 'react-bootstrap';
import Button from '../UI/Button';
import {Copy} from 'react-feather';
import CustomSkeleton from '../CustomSkeleton';
import Truncate from 'react-truncate-inside';
import {copyToClipboard} from '../../tools';

interface IAddressInfoProps {
  address: string;
  width: number;
  iconSize?: number;
}

const AddressInfo = ({address, width, iconSize = 20}: IAddressInfoProps) => {
  return (
    <Row>
      <Col xs={12}>
        <div className="flex my-2 items-center justify-start gap-2">
          <h6 className="secondaryText width-fit">
            This is your address
            <Button
              className="inline-element"
              icon={<Copy size={iconSize} />}
              onClick={() => copyToClipboard(address)}
            />
          </h6>
        </div>
        <div className="flex flex-row justify-start">
          <CustomSkeleton show={!!address} altProps={{height: 20, width: 300}}>
            <div className="flex flex-row">
              <h5 className="selectable-text">
                <Truncate text={address} width={width || 1000} />
              </h5>
            </div>
          </CustomSkeleton>
        </div>
      </Col>
    </Row>
  );
};

export default AddressInfo;
