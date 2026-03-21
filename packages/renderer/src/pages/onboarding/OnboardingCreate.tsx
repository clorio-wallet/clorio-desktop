import { useState } from 'react';
import { isElectron } from '/@/tools/environment';
import { useNavigate } from 'react-router-dom';
import RegisterStep from '../../components/UI/registration/RegistrationStep';
import AccountSelection from '../../components/UI/registration/AccountSelection';
import type { IKeypair, INetworkData } from '/@/types';
import { deriveWalletByMnemonic, setPassphrase, storeAccounts, storeSession } from '/@/tools';
import { generateKeypair } from '#preload';
import { generateMnemonic } from 'bip39';
import SecureDataStorageComponent from '/@/components/ReadSecureStorage';
import useSecureStorage from '/@/hooks/useSecureStorage';
import { useWallet } from '/@/contexts/WalletContext';
import OnboardingLayout from './OnboardingLayout';
import VerifyMnemonic from '../mnemonic/VerifyMnemonic';

interface IProps {
  network?: INetworkData;
  toggleLoader: () => void;
}

export enum REGISTRATION_STEPS {
  ACCOUNT_SELECT = 'ACCOUNT_SELECT',
  REGISTRATION = 'REGISTRATION',
  VERIFICATION = 'VERIFICATION',
}

/** Maps the internal step enum to a 1-based step index for the progress bar */
const STEP_INDEX: Record<REGISTRATION_STEPS, number> = {
  [REGISTRATION_STEPS.ACCOUNT_SELECT]: 1,
  [REGISTRATION_STEPS.REGISTRATION]: 2,
  [REGISTRATION_STEPS.VERIFICATION]: 3,
};

const TOTAL_STEPS = 3;

export default function OnboardingCreate({ network, toggleLoader }: IProps) {
  const navigate = useNavigate();
  const { updateWallet } = useWallet();
  const [storePassphrase, setStorePassphrase] = useState<boolean>(true);
  const [step, setStep] = useState(REGISTRATION_STEPS.ACCOUNT_SELECT);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { encryptData } = useSecureStorage();
  const [keypair, setKeypair] = useState<IKeypair>({
    privateKey: '',
    publicKey: '',
    mnemonic: '',
  });

  const storePassphraseHandler = () => setStorePassphrase(!storePassphrase);

  const completeRegistration = async () => {
    if (storePassphrase) {
      setShowPasswordModal(true);
    } else {
      toggleLoader();
      saveAndStoreSession();
    }
  };

  const [verify, setVerify] = useState<boolean>(false);

  const saveAndStoreSession = async () => {
    await storeSession({
      address: keypair.publicKey,
      id: -1,
      ledger: false,
      ledgerAccount: 0,
      mnemonic: true,
      accountNumber: 0,
    });
    await updateWallet({
      address: keypair.publicKey,
      id: -1,
      ledger: false,
      ledgerAccount: 0,
      mnemonic: true,
      accountNumber: 0,
    });
    await storeAccounts([{ accountId: 0, address: keypair.publicKey }]);
    setPassphrase(!!keypair.mnemonic);
    navigate('/overview');
  };

  const generateKeys = async (mnemonic: string) => {
    const keys = await deriveWalletByMnemonic(mnemonic);
    if (keys) {
      const { priKey, pubKey } = keys;
      return { privateKey: priKey, publicKey: pubKey, mnemonic };
    }
    return undefined;
  };

  const toggleVerificationStep = (state?: boolean) => {
    setVerify(state || !verify);
  };

  const generateAndDeriveKeypair = async () => {
    if (!isElectron()) {
      const mnemonic = generateMnemonic();
      return generateKeys(mnemonic);
    } else {
      const generatedMnemonic = generateKeypair();
      return generateKeys(generatedMnemonic);
    }
  };

  const onSecureStorageSubmit = (key: string) => {
    toggleLoader();
    saveAndStoreSession();
    encryptData({ key, data: keypair.mnemonic as string });
    setShowPasswordModal(false);
  };

  return (
    <OnboardingLayout step={{ current: STEP_INDEX[step], total: TOTAL_STEPS }}>
      <SecureDataStorageComponent
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={onSecureStorageSubmit}
      />

      {step === REGISTRATION_STEPS.VERIFICATION ? (
        <VerifyMnemonic
          mnemonic={keypair.mnemonic || ''}
          closeVerification={toggleVerificationStep}
          completeRegistration={completeRegistration}
          storePassphraseHandler={storePassphraseHandler}
          storePassphrase={storePassphrase}
          goBack={() => setStep(REGISTRATION_STEPS.REGISTRATION)}
        />
      ) : step === REGISTRATION_STEPS.REGISTRATION ? (
        <RegisterStep
          keys={keypair}
          setValidation={toggleVerificationStep}
          network={network}
          goToNext={() => setStep(REGISTRATION_STEPS.VERIFICATION)}
          goBack={() => setStep(REGISTRATION_STEPS.ACCOUNT_SELECT)}
        />
      ) : (
        <AccountSelection
          generateKeypair={generateAndDeriveKeypair}
          setKeypair={setKeypair}
          selectedKeypair={keypair}
          goToNext={() => setStep(REGISTRATION_STEPS.REGISTRATION)}
        />
      )}
    </OnboardingLayout>
  );
}
