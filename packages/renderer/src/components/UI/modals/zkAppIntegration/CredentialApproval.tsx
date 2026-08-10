import {FormEvent, useMemo, useRef, useState} from 'react';
import {Database, Loader, Lock} from 'react-feather';
import {toast} from 'react-toastify';
import {useRecoilState, useRecoilValue} from 'recoil';
import useSecureStorage from '/@/hooks/useSecureStorage';
import {credentialApprovalState, walletState} from '/@/store';
import {ERROR_CODES} from '/@/tools/zkapp';
import {getCredentialPreview, storePrivateCredential} from '/@/tools/credentials';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../../Button';
import Input from '../../input/Input';
import {
  ZkappModal,
  ZkappModalActions,
  ZkappModalDetails,
  ZkappModalNotice,
} from './ZkappModal';
import styles from './ZkappApprovalForm.module.scss';

const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;

export default function CredentialApproval() {
  const wallet = useRecoilValue(walletState);
  const [{show, request}, setCredentialApproval] = useRecoilState(credentialApprovalState);
  const {decryptData} = useSecureStorage();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const preview = useMemo(() => {
    if (!request) return null;
    try {
      return getCredentialPreview(request.credential);
    } catch {
      return null;
    }
  }, [request]);
  const site = useMemo(() => {
    try {
      return new URL(request?.source ?? '').hostname;
    } catch {
      return request?.source ?? 'Unknown site';
    }
  }, [request?.source]);

  const reset = () => {
    submittingRef.current = false;
    setPassword('');
    setIsSubmitting(false);
    setCredentialApproval({show: false, request: null});
  };

  const reject = () => {
    if (isSubmitting) return;
    sendResponse('clorio-error', ERROR_CODES.userRejectedRequest);
    reset();
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!request || !preview || submittingRef.current || !passwordRegex.test(password)) return;

    let walletSecret: string;
    try {
      const decrypted = decryptData(password);
      if (!decrypted) throw new Error('Wrong password');
      walletSecret = decrypted;
    } catch {
      toast.error('Wrong password');
      return;
    }

    submittingRef.current = true;
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
    <ZkappModal
      show={show}
      close={isSubmitting ? undefined : reject}
      title="Store credential"
      subtitle="Review and encrypt this credential for future private proofs."
      icon={<Database size={20} />}
    >
      <ZkappModalDetails items={[
        {label: 'Requesting site', value: site, title: request?.source},
        {label: 'Account', value: wallet.address, title: wallet.address},
        {label: 'Credential', value: preview ? `${preview.size} bytes` : 'Invalid credential'},
      ]} />
      <ZkappModalNotice icon={<Lock size={17} />} title="Encrypted on this device">
        The credential is never shared without another explicit approval.
      </ZkappModalNotice>

      <form className={styles.form} onSubmit={confirm}>
        <label className={styles.label} htmlFor="credential-password">Wallet password</label>
        <div className={styles.input}>
          <Input
            id="credential-password"
            name="credential-password"
            type="text"
            hidden
            value={password}
            disabled={isSubmitting}
            placeholder="Enter your password"
            inputHandler={event => setPassword(event.target.value)}
          />
        </div>
        <p className={styles.hint}>Required to encrypt the credential locally.</p>

        {isSubmitting && (
          <div className={styles.status} role="status" aria-live="polite">
            <Loader className={styles.statusIcon} size={20} aria-hidden="true" />
            <div><strong>Encrypting credential…</strong><span>Keep Clorio open.</span></div>
          </div>
        )}

        <ZkappModalActions>
          <Button text="Reject" variant="outlined" disabled={isSubmitting} onClick={reject} />
          <Button
            type="submit"
            text="Store securely"
            style="primary"
            loading={isSubmitting}
            disabled={isSubmitting || !preview || !passwordRegex.test(password)}
          />
        </ZkappModalActions>
      </form>
    </ZkappModal>
  );
}
