import {useEffect, useState} from 'react';
import {Row, Col} from 'react-bootstrap';
import {ArrowLeft, ArrowRight} from 'react-feather';
import Button from '../Button';
import Input from '../input/Input';
import {useRecoilValue, useSetRecoilState} from 'recoil';
import {deeplinkState} from '/@/store';

interface IProps {
  closeModal: () => void;
  confirmCustomDelegate: (customDelegate: string) => void;
}

export const ConfirmCustomDelegation = ({closeModal, confirmCustomDelegate}: IProps) => {
  const [customDelegate, setCustomDelegate] = useState<string>('');
  const deeplinkData = useRecoilValue(deeplinkState);
  const setDeeplinkData = useSetRecoilState(deeplinkState);
  const isDeeplink = !!deeplinkData?.data?.delegator;
  useEffect(() => {
    if (deeplinkData?.data?.delegator) {
      setCustomDelegate(deeplinkData.data.delegator);
      setDeeplinkData({type: '', data: {}});
    }
  }, [deeplinkData]);

  return (
    <div className="min-width-500">
      <div className="w-100">
        <div className="flex flex-col ">
          <h1 className="mb-0">Custom delegation </h1>
          <p className="mt-1 mb-1">Delegate to someone that is not in the list</p>
          <div className="divider w-100" />
        </div>
      </div>
      {isDeeplink && (
        <div className="alert alert-warning mt-2">
          <strong>Warning!</strong> You are delegating to a custom delegate from a deeplink
        </div>
      )}

      <div className="align-left mt-1 mb-2 label">
        <strong>Public key</strong>
      </div>
      <Input
        inputHandler={e => {
          setCustomDelegate(e.currentTarget.value);
        }}
        value={customDelegate}
        placeholder="Insert public key"
      />
      <Row>
        <Col xs={6}>
          <Button
            icon={<ArrowLeft />}
            text="Cancel"
            onClick={closeModal}
            style="quiet"
          />
        </Col>
        <Col xs={6}>
          <Button
            text="Confirm"
            style="primary"
            icon={<ArrowRight />}
            appendIcon
            onClick={() => confirmCustomDelegate(customDelegate)}
            disabled={!customDelegate}
          />
        </Col>
      </Row>
    </div>
  );
};
