import {FormEvent, useMemo, useRef, useState} from 'react';
import {Loader, Lock, Shield} from 'react-feather';
import {toast} from 'react-toastify';
import {useRecoilState, useRecoilValue} from 'recoil';
import useSecureStorage from '/@/hooks/useSecureStorage';
import {walletState, zkappState} from '/@/store';
import {ERROR_CODES} from '/@/tools/zkapp';
import {requestPresentation} from '/@/tools/presentations';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import {mnemonicToPrivateKey} from '../../../../../../preload/src/bip';
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

export default function PresentationApproval() {
  const wallet = useRecoilValue(walletState);
  const [{showPresentationApproval, presentationRequest}, setZkappState] =
    useRecoilState(zkappState);
  const {decryptData} = useSecureStorage();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const site = useMemo(() => {
    try {
      return new URL(presentationRequest?.source ?? '').hostname;
    } catch {
      return presentationRequest?.source ?? 'Unknown site';
    }
  }, [presentationRequest?.source]);

  const reset = () => {
    submittingRef.current = false;
    setPassword('');
    setStatus('');
    setIsSubmitting(false);
    setZkappState(state => ({
      ...state,
      showPresentationApproval: false,
      presentationRequest: null,
    }));
  };

  const reject = () => {
    if (isSubmitting) return;
    sendResponse('clorio-error', ERROR_CODES.userRejectedRequest);
    reset();
  };

  const approve = async (event: FormEvent) => {
    event.preventDefault();
    if (!presentationRequest || submittingRef.current || !passwordRegex.test(password)) return;

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
    setStatus('Unlocking your credential…');
    try {
      const privateKey =
        walletSecret.trim().split(' ').length > 2
          ? (await mnemonicToPrivateKey(walletSecret, wallet.accountNumber)) || walletSecret
          : walletSecret;
      const result = await requestPresentation({
        presentationRequest: presentationRequest.request,
        origin: presentationRequest.source,
        accountPublicKey: wallet.address,
        walletSecret,
        privateKey,
        onProgress: setStatus,
      });
      sendResponse('clorio-presentation-created', result);
      reset();
    } catch (error) {
      console.error('Presentation generation failed:', error);
      sendResponse('clorio-error', {
        ...ERROR_CODES.invalidParams,
        message: error instanceof Error ? error.message : ERROR_CODES.invalidParams.message,
      });
      reset();
    }
  };

  return (
    <ZkappModal
      show={showPresentationApproval}
      close={isSubmitting ? undefined : reject}
      title="Anonymous login"
      subtitle="Prove credential ownership without revealing its contents."
      icon={<Shield size={20} />}
    >
      <ZkappModalDetails items={[
        {label: 'Requesting site', value: site, title: presentationRequest?.source},
        {label: 'Account', value: wallet.address, title: wallet.address},
      ]} />
      <ZkappModalNotice icon={<Lock size={17} />} title="Your credential stays private">
        Only a zero-knowledge proof is shared with this site.
      </ZkappModalNotice>

      <form className={styles.form} onSubmit={approve}>
        <label className={styles.label} htmlFor="presentation-password">Wallet password</label>
        <div className={styles.input}>
          <Input
            id="presentation-password"
            name="presentation-password"
            type="text"
            hidden
            value={password}
            disabled={isSubmitting}
            placeholder="Enter your password"
            inputHandler={event => setPassword(event.target.value)}
          />
        </div>
        <p className={styles.hint}>Required to unlock and sign this presentation locally.</p>

        {isSubmitting && (
          <div className={styles.status} role="status" aria-live="polite">
            <Loader className={styles.statusIcon} size={20} aria-hidden="true" />
            <div><strong>{status}</strong><span>This may take up to a minute. Keep Clorio open.</span></div>
          </div>
        )}

        <ZkappModalActions>
          <Button text="Reject" variant="outlined" disabled={isSubmitting} onClick={reject} />
          <Button
            type="submit"
            text={isSubmitting ? 'Generating proof' : 'Generate proof'}
            style="primary"
            loading={isSubmitting}
            disabled={isSubmitting || !presentationRequest || !passwordRegex.test(password)}
          />
        </ZkappModalActions>
      </form>
    </ZkappModal>
  );
}
