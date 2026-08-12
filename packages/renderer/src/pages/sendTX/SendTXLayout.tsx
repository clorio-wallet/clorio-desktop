import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import Logo from '../../components/UI/logo/Logo';

export interface SendTXStep {
  total: number;
  current: number;
}

interface SendTXLayoutProps {
  children: ReactNode;
  step?: SendTXStep;
}

export default function SendTXLayout({children, step}: SendTXLayoutProps) {
  return (
    <div className="sendtx-layout animate__animated animate__fadeIn full-width">
      <header className="sendtx-layout__header">
        <h1 className="sendtx-layout__title">New Transaction</h1>

        {step && (
          <div
            className="sendtx-layout__step-indicator"
            aria-label={`Step ${step.current} of ${step.total}`}
          >
            <span className="sendtx-layout__step-label">
              STEP{' '}
              <strong>{String(step.current).padStart(2, '0')}</strong>
              {' / '}
              {String(step.total).padStart(2, '0')}
            </span>
            <div
              className="sendtx-layout__step-track"
              role="progressbar"
              aria-valuenow={step.current}
              aria-valuemin={1}
              aria-valuemax={step.total}
            >
              {Array.from({length: step.total}).map((_, i) => (
                <div
                  key={i}
                  className={`sendtx-layout__step-segment ${
                    i < step.current ? 'sendtx-layout__step-segment--done' : ''
                  } ${i === step.current - 1 ? 'sendtx-layout__step-segment--active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="sendtx-layout__main">{children}</main>
    </div>
  );
}
