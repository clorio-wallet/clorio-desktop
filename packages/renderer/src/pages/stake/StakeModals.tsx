import {
  ConfirmCustomDelegation,
  ConfirmDelegation,
  CustomNonce,
  DelegationFee,
  ModalContainer,
  PrivateKeyModal,
} from '../../components/UI/modals';
import WaitingLedger from '/@/components/UI/modals/WaitingLedger';
import { ModalStates } from './StakeHelper';
import { IValidatorData } from '/@/components/stake/stakeTableRow/ValidatorDataTypes';
import { IFeeQuery } from '/@/types/Fee';

interface IStakeModalsProps {
  showModal: string;
  closeModal: () => void;
  delegateData: IValidatorData;
  confirmDelegate: () => void;
  nonceAndDelegateLoading: boolean;
  closeNonceModal: () => void;
  confirmCustomDelegate: (delegate: string) => void;
  setCustomNonce: (nonce: number) => void;
  customNonce: number;
  isLedgerEnabled: boolean;
  signDelegation: (passphrase?: string) => void;
  setPrivateKey: (key: string) => void;
  customDelegate: string;
  storedPassphrase: boolean;
  feeData: IFeeQuery;
  setFee: (fee: number) => void;
}

export const StakeModals = ({
  showModal,
  closeModal,
  delegateData,
  confirmDelegate,
  nonceAndDelegateLoading,
  closeNonceModal,
  confirmCustomDelegate,
  setCustomNonce,
  customNonce,
  isLedgerEnabled,
  signDelegation,
  setPrivateKey,
  customDelegate,
  storedPassphrase,
  feeData,
  setFee,
}: IStakeModalsProps) => {
  return (
    <>
      <ModalContainer
        show={showModal === ModalStates.CONFIRM_DELEGATION}
        close={closeModal}
      >
        <ConfirmDelegation
          name={delegateData?.name}
          closeModal={closeModal}
          confirmDelegate={confirmDelegate}
          loadingNonce={nonceAndDelegateLoading}
        />
      </ModalContainer>
      <ModalContainer
        show={showModal === ModalStates.NONCE}
        close={closeNonceModal}
      >
        <CustomNonce
          proceedHandler={confirmDelegate}
          setCustomNonce={setCustomNonce}
          nonce={customNonce}
        />
      </ModalContainer>
      <ModalContainer
        show={showModal === ModalStates.PASSPHRASE}
        close={closeModal}
      >
        {isLedgerEnabled ? (
          <WaitingLedger closeModal={closeModal} />
        ) : (
          <PrivateKeyModal
            confirmPrivateKey={signDelegation}
            closeModal={closeModal}
            setPrivateKey={setPrivateKey}
            subtitle={customDelegate && `You are going to delegate ${customDelegate}`}
            storedPassphrase={storedPassphrase}
          />
        )}
      </ModalContainer>
      <ModalContainer
        show={showModal === ModalStates.CUSTOM_DELEGATION}
        close={closeModal}
      >
        <ConfirmCustomDelegation
          closeModal={closeModal}
          confirmCustomDelegate={confirmCustomDelegate}
        />
      </ModalContainer>
      <ModalContainer
        show={showModal === ModalStates.FEE}
        close={closeModal}
      >
        <DelegationFee
          closeModal={closeModal}
          fees={feeData}
          proceedHandler={setFee}
        />
      </ModalContainer>
    </>
  );
};
