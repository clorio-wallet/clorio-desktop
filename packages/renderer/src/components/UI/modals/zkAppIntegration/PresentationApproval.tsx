import {useState} from 'react';
import {useRecoilState, useRecoilValue} from 'recoil';
import PasswordDecrypt from '/@/components/PasswordDecrypt';
import {walletState, zkappState} from '/@/store';
import {ERROR_CODES} from '/@/tools/zkapp';
import {requestPresentation} from '/@/tools/presentations';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../../Button';
import {ModalContainer} from '../ModalContainer';

export default function PresentationApproval() {
  const wallet = useRecoilValue(walletState);
  const [{showPresentationApproval, presentationRequest}, setZkappState] =
    useRecoilState(zkappState);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setShowPassword(false);
    setIsSubmitting(false);
    setZkappState(state => ({
      ...state,
      showPresentationApproval: false,
      presentationRequest: null,
    }));
  };

  const reject = () => {
    sendResponse('clorio-error', ERROR_CODES.userRejectedRequest);
    reset();
  };

  const approve = async (privateKey: string) => {
    if (!presentationRequest) return;
    setIsSubmitting(true);
    try {
      const result = await requestPresentation({
        presentationRequest: presentationRequest.request,
        origin: presentationRequest.source,
        accountPublicKey: wallet.address,
        privateKey,
      });
      sendResponse('clorio-presentation-created', result);
      reset();
    } catch (error) {
      console.error('Presentation generation failed:', error);
      sendResponse('clorio-error', {
        ...ERROR_CODES.invalidParams,
        message:
          error instanceof Error ? error.message : ERROR_CODES.invalidParams.message,
      });
      reset();
    }
  };

  return (
    <ModalContainer
      show={showPresentationApproval}
      close={reject}
      closeOnBackgroundClick={false}
      className="confirm-transaction-modal"
    >
      <div>
        <h1 id="modal-title">Anonymous login</h1>
        <hr />
      </div>
      {showPassword ? (
        <PasswordDecrypt onClose={() => setShowPassword(false)} onSuccess={approve} />
      ) : (
        <div className="flex flex-col gap-4">
          <p>
            A zkApp wants to prove you hold a credential without revealing any
            personal data through a ZK presentation.
          </p>
          <div className="transaction-data">
            <h4>Account</h4>
            <span className="data-field">{wallet.address}</span>
          </div>
          <p className="small m-0">
            The proof is generated from your stored credential. It will be
            prepared locally and finalized with a signature from your account.
          </p>
          <div className="flex mt-2 gap-4 confirm-transaction-data sm-flex-reverse">
            <Button
              className="w-100"
              text="Reject"
              variant="outlined"
              onClick={reject}
            />
            <Button
              className="w-100"
              text="Login"
              style="primary"
              loading={isSubmitting}
              disabled={!presentationRequest}
              onClick={() => setShowPassword(true)}
            />
          </div>
        </div>
      )}
    </ModalContainer>
  );
}
