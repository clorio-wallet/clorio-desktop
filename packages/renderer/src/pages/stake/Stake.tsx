import Hoc from '../../components/UI/Hoc';
import NewsBanner from '../../components/UI/NewsBanner';
import StakeTable from '../../components/stake/stakeTable/StakeTable';
import {IWalletData} from '/@/types/WalletData';
import {VALIDATORS_TABLE_ITEMS_PER_PAGE} from '/@/tools';
import {useStake} from './useStake';
import {StakeModals} from './StakeModals';

interface IProps {
  sessionData: IWalletData;
}

const Stake = ({sessionData}: IProps) => {
  const {
    address,
    changeOffset,
    closeModal,
    closeNonceModal,
    confirmCustomDelegate,
    confirmDelegate,
    currentDelegate,
    currentDelegateName,
    customDelegate,
    customNonce,
    delegateData,
    feeData,
    isLedgerEnabled,
    latestNews,
    nonceAndDelegateLoading,
    offset,
    openCustomDelegateModal,
    openModal,
    setCustomNonce,
    setFee,
    setPrivateKey,
    showModal,
    signDelegation,
    storedPassphrase,
    validatorsData,
    validatorsError,
    validatorsLoading,
  } = useStake(sessionData);

  return (
    <Hoc>
      <div className="animate__animated animate__fadeIn">
        <NewsBanner {...latestNews} />
        <StakeTable
          address={address}
          toggleModal={openModal}
          validators={validatorsData?.validators}
          loading={validatorsLoading}
          error={validatorsError}
          currentDelegate={currentDelegate}
          currentDelegateName={currentDelegateName}
          openCustomDelegateModal={openCustomDelegateModal}
          setOffset={changeOffset}
          page={offset / VALIDATORS_TABLE_ITEMS_PER_PAGE + 1}
          delegateLoading={nonceAndDelegateLoading}
        />
      </div>
      <StakeModals
        showModal={showModal}
        closeModal={closeModal}
        delegateData={delegateData}
        confirmDelegate={confirmDelegate}
        nonceAndDelegateLoading={nonceAndDelegateLoading}
        closeNonceModal={closeNonceModal}
        confirmCustomDelegate={confirmCustomDelegate}
        setCustomNonce={setCustomNonce}
        customNonce={customNonce}
        isLedgerEnabled={isLedgerEnabled}
        signDelegation={signDelegation}
        setPrivateKey={setPrivateKey}
        customDelegate={customDelegate}
        storedPassphrase={storedPassphrase}
        feeData={feeData}
        setFee={setFee}
      />
    </Hoc>
  );
};

export default Stake;
