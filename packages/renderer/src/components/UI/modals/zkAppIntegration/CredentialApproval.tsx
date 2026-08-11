import {useMemo, useState} from 'react';
import {useRecoilState, useRecoilValue} from 'recoil';
import PasswordDecrypt from '/@/components/PasswordDecrypt';
import {credentialApprovalState, walletState} from '/@/store';
import {ERROR_CODES} from '/@/tools/zkapp';
import {
  getCredentialPreview,
  storePrivateCredential,
} from '/@/tools/credentials';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../../Button';
import {ModalContainer} from '../ModalContainer';

export default function CredentialApproval() {
  const wallet = useRecoilValue(walletState);
  const [{show, request}, setCredentialApproval] = useRecoilState(credentialApprovalState);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo(() => {
    if (!request) return null;
    try {
      return getCredentialPreview(request.credential);
    } catch {
      return null;
    }
  }, [request]);

  const reset = () => {
    setShowPassword(false);
    setIsSubmitting(false);
    setCredentialApproval({show: false, request: null});
  };

  const reject = () => {
    sendResponse('clorio-error', ERROR_CODES.userRejectedRequest);
    reset();
  };

  const confirm = async (walletSecret: string) => {
    if (!request) return;
    setIsSubmitting(true);
    try {
      const result = await storePrivateCredential({
        credential: request.credential,
        sourceOrigin: request.source,
        accountPublicKey: wallet.address,
        walletSecret,
      });
      sendResponse('clorio-stored-private-credential', result);
      reset();
    } catch (error) {
      sendResponse('clorio-error', {
        ...ERROR_CODES.invalidParams,
        message: error instanceof Error ? error.message : ERROR_CODES.invalidParams.message,
      });
      reset();
    }
  };

  return (
    <ModalContainer
      show={show}
      close={reject}
      closeOnBackgroundClick={false}
      className="confirm-transaction-modal"
    >
      <div>
        <h1 id="modal-title">Store credential</h1>
        <hr />
      </div>
      {showPassword ? (
        <PasswordDecrypt
          onClose={() => setShowPassword(false)}
          onSuccess={confirm}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <p>
            <strong>{request?.source}</strong> wants to store a credential for the
            active account.
          </p>
          <div className="transaction-data">
            <h4>Account</h4>
            <span className="data-field">{wallet.address}</span>
          </div>
          <div className="transaction-data">
            <h4>Credential details</h4>
            <span className="data-field">
              {preview?.owner ? `Owner: ${preview.owner} · ` : ''}
              {preview ? `${preview.size} bytes` : 'Invalid credential'}
            </span>
          </div>
          <p className="small m-0">
            The credential will be encrypted locally. It will not be presented to a site
            without another approval.
          </p>
          <div className="flex mt-2 gap-4 confirm-transaction-data sm-flex-reverse">
            <Button className="w-100" text="Reject" variant="outlined" onClick={reject} />
            <Button
              className="w-100"
              text="Store"
              style="primary"
              loading={isSubmitting}
              disabled={!preview}
              onClick={() => setShowPassword(true)}
            />
          </div>
        </div>
      )}
    </ModalContainer>
  );
}
