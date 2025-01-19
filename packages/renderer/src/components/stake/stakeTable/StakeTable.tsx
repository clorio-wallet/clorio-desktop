import {useState} from 'react';
import Button from '../../UI/Button';
import StakeTableRow from '../stakeTableRow/StakeTableRow';
import {Row, Col, Table} from 'react-bootstrap';
import StakeStatus from '../StakeStatus';
import ReactTooltip from 'react-tooltip';
import type {IValidatorData} from '../stakeTableRow/ValidatorDataTypes';
import StakeTableError from './StakeTableError';
import Spinner from '../../UI/Spinner';
import Pagination from '../../UI/pagination/Pagination';
import {GET_VALIDATORS_TOTAL} from '../../../graphql/query';
import {getTotalPages} from '../../../tools';
import {useQuery} from '@apollo/client';
import EpochBar from '../../UI/epochBar/EpochBar';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import DataTable from 'react-data-table-component';
import {columns, customStyles} from './StakeTableRows';

interface IProps {
  error: any;
  validators: IValidatorData[];
  toggleModal: (element: IValidatorData) => void;
  openCustomDelegateModal: () => void;
  currentDelegate: string;
  currentDelegateName: string;
  loading: boolean;
  delegateLoading: boolean;
  page: number;
  setOffset: (page: number) => void;
  address: string;
}

const StakeTable = ({
  error,
  validators,
  toggleModal,
  openCustomDelegateModal,
  currentDelegate,
  currentDelegateName,
  loading,
  delegateLoading,
  setOffset,
  page,
  address,
}: IProps) => {
  const [searchBox] = useState<string>('');
  const {data: validatorsTotalData} = useQuery(GET_VALIDATORS_TOTAL);

  const totalPages = getTotalPages(
    validatorsTotalData?.validators_aggregate?.aggregate?.count || 0,
    false,
  );
  /**
   * Store search text inside component state (temporarily disabled, needs backend search query)
   * @param search string Search text
   */
  // const searchBoxHandler = (search: string) => {
  //   setSearchBox(search.toLowerCase());
  // };

  const {settings} = useNetworkSettingsContext();
  const validatorsDisabled = settings?.hideValidators;
  const epochDisabled = !settings?.epochUrl;

  const tableBody = () => {
    if (validators) {
      console.log('🚀 ~ tableBody ~ validators:', validators);
      const filteredValidators = validators.filter(el =>
        el?.name?.toLowerCase().includes(searchBox),
      );
      return (
        <tbody>
          {filteredValidators.map((el, index: number) => {
            const isDelegating = el.publicKey === currentDelegate;
            return (
              <StakeTableRow
                key={index}
                element={el}
                index={index}
                toggleModal={toggleModal}
                isDelegating={isDelegating}
                loading={delegateLoading}
              />
            );
          })}
        </tbody>
      );
    }
    return <tbody />;
  };

  if (error) {
    return <StakeTableError />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Row className="row-gap-4">
        <Col>
          <div className="glass-card p-4 center-content flex-col-left h-95 flex flex-vertical-center stake-info-left">
            <div className="w-100">
              <StakeStatus
                currentDelegate={currentDelegate}
                currentDelegateName={currentDelegateName}
                address={address}
              />
            </div>
          </div>
        </Col>
        <Col>
          <div
            className={`glass-card p-4 center-content flex-col-left stake-info-right ${
              epochDisabled ? 'disabled-glass-card' : ''
            }`}
          >
            <div className="w-100 mt-2">
              <EpochBar />
            </div>
          </div>
        </Col>
      </Row>
      <div className={`glass-card p-4 py-50 ${validatorsDisabled ? 'disabled-glass-card' : ''}`}>
        <div>
          <Row>
            <Col className="mt-0">
              <h2>Delegates</h2>
            </Col>
            <Col
              md={3}
              lg={4}
              xl={3}
              className="align-end small-screen-align-left"
            >
              <Button
                className="link-button custom-delegate-button purple-text"
                text="Custom delegation"
                onClick={openCustomDelegateModal}
              />
            </Col>
          </Row>
          {validatorsDisabled ? (
            <div>The validators list is not available for this network</div>
          ) : (
            <>
              <Spinner
                className={'full-width'}
                show={loading}
              >
                <div id="transaction-table">
                  <DataTable
                    columns={columns(toggleModal, currentDelegate)}
                    data={validators || []}
                    // expandOnRowClicked
                    // expandableRows
                    // expandableIcon={() => <></>}
                    highlightOnHover
                    persistTableHead
                    responsive
                    subHeaderWrap
                    customStyles={customStyles}
                    conditionalRowStyles={[
                      {
                        when: row => row.priority === '1',
                        style: {
                          backgroundColor: 'rgb(255 254 231 / 22%)',
                        },
                      },
                    ]}
                  />
                  <ReactTooltip multiline={true} />
                </div>
              </Spinner>
              <Pagination
                page={page}
                setOffset={setOffset}
                total={totalPages}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakeTable;
