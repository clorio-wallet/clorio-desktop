import {useMemo} from 'react';
import {useQuery} from '@apollo/client';
import ReactTooltip from 'react-tooltip';
import Button from '../../UI/Button';
import StakeTableRow from '../stakeTableRow/StakeTableRow';
import StakeStatus from '../StakeStatus';
import type {IValidatorData} from '../stakeTableRow/ValidatorDataTypes';
import StakeTableError from './StakeTableError';
import Spinner from '../../UI/Spinner';
import Pagination from '../../UI/pagination/Pagination';
import {GET_VALIDATORS_TOTAL} from '../../../graphql/query';
import {getTotalPages} from '../../../tools';
import EpochBar from '../../UI/epochBar/EpochBar';
import {useNetworkSettingsContext} from '/@/contexts/NetworkContext';
import './StakeTable.scss';

interface IProps {
  error: any;
  validators?: IValidatorData[];
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
  const {data: validatorsTotalData} = useQuery(GET_VALIDATORS_TOTAL);
  const {settings} = useNetworkSettingsContext();

  const validatorsDisabled = settings?.hideValidators;
  const epochDisabled = !settings?.epochUrl;
  const totalPages = getTotalPages(
    validatorsTotalData?.validators_aggregate?.aggregate?.count || 0,
    false,
  );

  const filteredValidators = useMemo(() => validators || [], [validators]);

  const tableRows = filteredValidators.map((validator, index) => (
    <StakeTableRow
      key={`validator-row-${validator.publicKey}-${index}`}
      element={validator}
      index={index}
      toggleModal={toggleModal}
      isDelegating={validator.publicKey === currentDelegate}
      loading={delegateLoading}
    />
  ));

  const mobileCards = filteredValidators.map((validator, index) => (
    <StakeTableRow
      key={`validator-card-${validator.publicKey}-${index}`}
      element={validator}
      index={index}
      toggleModal={toggleModal}
      isDelegating={validator.publicKey === currentDelegate}
      loading={delegateLoading}
      mode="card"
    />
  ));

  if (error) {
    return <StakeTableError />;
  }

  return (
    <div className="stake-table-shell">
      <section className="stake-overview-grid">
        <div className="glass-card stake-overview-card">
          <StakeStatus
            currentDelegate={currentDelegate}
            currentDelegateName={currentDelegateName}
            address={address}
          />
        </div>
        <div className={`glass-card stake-overview-card ${epochDisabled ? 'disabled-glass-card' : ''}`}>
          <EpochBar />
        </div>
      </section>

      <section className={`glass-card stake-table-panel ${validatorsDisabled ? 'disabled-glass-card' : ''}`}>
        <div className="stake-table-panel__header">
          <div className="stake-table-panel__copy">
            <span className="stake-table-panel__eyebrow">Delegation marketplace</span>
            <h2 className="stake-table-panel__title">Delegates</h2>
            <p className="stake-table-panel__subtitle">
              Compare validator fees and stake distribution before delegating.
            </p>
          </div>
          <Button
            className="stake-table-panel__cta"
            text="Custom delegation"
            onClick={openCustomDelegateModal}
            style="quiet"

            size="sm"
          />
        </div>

        {validatorsDisabled ? (
          <div className="stake-table-panel__empty">
            The validators list is not available for this network.
          </div>
        ) : (
          <Spinner
            className="full-width"
            show={loading}
          >
            <ReactTooltip multiline={true} />

            <div className="stake-table-wrapper">
              <table className="stake-table">
                <thead>
                  <tr>
                    <th scope="col">Validator</th>
                    <th scope="col">Fee</th>
                    <th scope="col">Staked</th>
                    <th scope="col">Info</th>
                    <th
                      scope="col"
                      className="stake-table__th-action"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>{tableRows}</tbody>
              </table>
            </div>

            <div className="stake-card-list">{mobileCards}</div>

            <Pagination
              page={page}
              setOffset={setOffset}
              total={totalPages}
            />
          </Spinner>
        )}
      </section>
    </div>
  );
};

export default StakeTable;
