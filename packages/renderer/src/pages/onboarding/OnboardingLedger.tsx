import LedgerConnect from '../../components/ledgerLogin/LedgerConnect';
import OnboardingLayout from './OnboardingLayout';

interface IProps {
  accountNumber?: number;
  toggleLoader: () => void;
}

export default function OnboardingLedger(props: IProps) {
  return (
    <OnboardingLayout step={{current: 1, total: 2}}>
      <LedgerConnect {...props} />
    </OnboardingLayout>
  );
}
