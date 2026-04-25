import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import Footer from '../../components/UI/Footer';
import Logo from '/@/components/UI/logo/Logo';

export interface OnboardingStep {
  /** Total number of steps in this flow */
  total: number;
  /** 1-based current step index */
  current: number;
}

interface OnboardingLayoutProps {
  children: ReactNode;
  step?: OnboardingStep;
}

/**
 * Shared shell for all /onboarding/* step pages.
 *
 * Visual structure (matches the design images):
 *   ┌─────────────────────────────────────────┐
 *   │  header: [logo + badge]  [STEP 0x / 0x] │
 *   │─────────────────────────────────────────│
 *   │  main: page-specific content            │
 *   │─────────────────────────────────────────│
 *   │  footer                                 │
 *   └─────────────────────────────────────────┘
 */
export default function OnboardingLayout({children, step}: OnboardingLayoutProps) {
  return (
    <div className="onboarding-layout animate__animated animate__fadeIn">
      {/* ── Top bar ── */}
      <header className="onboarding-layout__header">
        <Link
          to="/login-selection"
          className="onboarding-layout__brand"
          aria-label="Back to onboarding start"
        >
          <Logo />
        </Link>

        {step && (
          <div
            className="onboarding-layout__step-indicator"
            aria-label={`Step ${step.current} of ${step.total}`}
          >
            <span className="onboarding-layout__step-label">
              STEP{' '}
              <strong>{String(step.current).padStart(2, '0')}</strong>
              {' / '}
              {String(step.total).padStart(2, '0')}
            </span>
            <div
              className="onboarding-layout__step-track"
              role="progressbar"
              aria-valuenow={step.current}
              aria-valuemin={1}
              aria-valuemax={step.total}
            >
              {Array.from({length: step.total}).map((_, i) => (
                <div
                  key={i}
                  className={`onboarding-layout__step-segment ${
                    i < step.current ? 'onboarding-layout__step-segment--done' : ''
                  } ${i === step.current - 1 ? 'onboarding-layout__step-segment--active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="onboarding-layout__main">{children}</main>

      {/* ── Footer ── */}
      <footer className="onboarding-layout__footer">
        <Footer isOnboarding />
      </footer>
    </div>
  );
}
