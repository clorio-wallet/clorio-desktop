import {Link} from 'react-router-dom';

const LedgerIncompatible = () => {
  return (
    <div className="ledger-page animate__animated animate__fadeIn">
      {/* ── Header ── */}
      <div className="oi-header">
        <h1 className="oi-title">Browser Incompatible</h1>
        <p className="oi-description">
          Please use a modern browser like Chrome, Edge, or Opera to connect your Ledger device.
        </p>
      </div>

      <div className="my-5 py-5 text-center px-4">
        <h6 className="opacity-70">
          ❌ Ledger hardware connection is not supported by your current browser.
        </h6>
      </div>

      <div className="ledger-purchase-hint">
        Do you need a Ledger wallet?
        <a
          href={import.meta.env.VITE_REACT_APP_LEDGER_URL}
          target="__blank"
        >
          Buy it here
        </a>
      </div>

      <div className="v-spacer" />

      {/* ── Footer row ── */}
      <div className="oi-footer-row mt-auto">
        <div className="oi-actions ms-auto">
          <Link to="/login-selection" className="oi-back">
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LedgerIncompatible;
