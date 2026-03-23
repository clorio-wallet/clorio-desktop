import { Row, Col } from 'react-bootstrap';
import { ArrowRight } from 'react-feather';
import Button from '../Button';
import Spinner from '../Spinner';

interface IProps {
  confirmDelegate: () => void;
  closeModal: () => void;
  loadingNonce?: boolean;
  name?: string;
}

export const ConfirmDelegation = ({
  name,
  closeModal,
  confirmDelegate,
  loadingNonce,
}: IProps) => (
  <Spinner show={loadingNonce} className="small-container">
    <div className="min-width-500">
      <div className="w-100">
        <div className="flex flex-col flex-vertical-center">
          <h1 className="mb-0">Confirm Delegation</h1>
          <div className="divider w-100" />
        </div>
      </div>
      <p className="align-center mx-auto">
        Are you sure you want to <br />
        delegate this stake to <strong>{name}</strong>
      </p>
      <div className="v-spacer" />
      <Row>
        <Col xs={6}>
          <Button
            className="big-icon-button"
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
            onClick={confirmDelegate}
          />
        </Col>
      </Row>
    </div>
  </Spinner>
);
