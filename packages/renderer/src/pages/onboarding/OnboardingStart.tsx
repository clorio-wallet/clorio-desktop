import {Link} from 'react-router-dom';
import {ArrowRight, Cpu, Key, PlusCircle} from 'react-feather';
import Footer from '../../components/UI/Footer';
import Typography from '../../components/UI/Typography';
import Logo from '/@/components/UI/logo/Logo';

const methods = [
  {
    to: '/onboarding/create',
    title: 'Create new wallet',
    description: 'Generate a new recovery phrase and create a wallet.',
    icon: <PlusCircle width={26} height={26} />,
    primary: true,
  },
  {
    to: '/onboarding/import',
    title: 'Import existing wallet',
    description: 'Restore with a recovery phrase or private key.',
    icon: <Key width={26} height={26} />,
  },
  {
    to: '/onboarding/ledger',
    title: 'Connect Ledger',
    description: 'Use your hardware wallet with the Mina app.',
    icon: <Cpu width={26} height={26} />,
  },
];

export default function OnboardingStart() {
  return (
    <div className="onboarding-layout animate__animated animate__fadeIn">
      {/* ── Header matching the step pages ── */}
      <header className="onboarding-layout__header">
        <div className="onboarding-layout__brand">
          <Logo />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="onboarding-layout__main onboarding-start-main">
        <div className="onboarding-start-copy">
          <Typography variant="h2" className="onboarding-start-title">
            Choose how to get started.
          </Typography>
          <Typography variant="body" className="onboarding-start-subtitle">
            Create a new wallet, import an existing one, or connect Ledger from a single onboarding path.
          </Typography>
        </div>

        <div className="onboarding-method-grid">
          {methods.map(method => (
            <Link
              key={method.title}
              to={method.to}
              className={`onboarding-method-card ${method.primary ? 'onboarding-method-card--primary' : ''}`}
            >
              <div className="onboarding-method-card__icon">{method.icon}</div>
              <div className="onboarding-method-card__content">
                <Typography variant="h3" align="left">
                  {method.title}
                </Typography>
                <Typography
                  variant="body"
                  align="left"
                  className="onboarding-method-card__description"
                >
                  {method.description}
                </Typography>
              </div>
              <span className="onboarding-method-card__arrow">
                <ArrowRight width={18} height={18} />
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="onboarding-layout__footer">
        <Footer />
      </footer>
    </div>
  );
}
