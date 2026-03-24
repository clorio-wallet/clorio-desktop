import LedgerLoader from '../UI/ledgerLogin/LedgerLoader';
import {ArrowLeft} from 'react-feather';
import Button from '../UI/Button';

const LedgerSearch = () => {
  return (
    <div className="ledger-page animate__animated animate__fadeIn">
      {/* ── Header ── */}
      <div className="oi-header">
        <h1 className="oi-title">Connect Ledger</h1>
        <p className="oi-description">
          Connect your Ledger device to your computer and open the Mina app to get started.
        </p>
      </div>

      {/* ── Animation ── */}
      <div className="ledger-animation-container">
        <LedgerLoader />
      </div>

      {/* ── Purchase hint ── */}
      <div className="ledger-purchase-hint">
        Do you need a Ledger wallet?
        <a
          href={import.meta.env.VITE_REACT_APP_LEDGER_URL}
          target="__blank"
        >
          Buy it here
        </a>
      </div>

      {/* ── Footer row ── */}
      <div className="oi-footer-row mt-auto">
        <div className="oi-actions ">
          <Button
            className="oi-back"
            text="Back"
            icon={<ArrowLeft />}
            link="/login-selection"
            style="no-style"
          />
        </div>
      </div>
    </div >
  );
};

export default LedgerSearch;
