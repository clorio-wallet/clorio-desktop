import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'react-feather';
import type { IKeypair } from '../../../types';
import Button from '../Button';
import AccountAvatar from './AccountAvatar';

interface IProps {
  generateKeypair: () => Promise<IKeypair | undefined>;
  setKeypair: (keypair: IKeypair) => void;
  selectedKeypair?: IKeypair;
  goToNext: () => void;
}

const AccountSelection = ({ generateKeypair, setKeypair, goToNext, selectedKeypair }: IProps) => {
  const isNextDisabled = () => {
    return !selectedKeypair?.privateKey;
  };

  return (
    <div className="oi-page animate__animated animate__fadeIn">
      <div className="oi-header">
        <h1 className="oi-title">Create new wallet</h1>
        <p className="oi-description">Select an avatar for your new account.</p>
      </div>

      <div className="onboarding-avatar-grid">
        <div className="flex flex-row justify-center gap-4 sm-flex-wrap">
          {[0, 1, 2, 3, 4].map(idx => (
            <AccountAvatar
              key={idx}
              setKeypair={setKeypair}
              generateKeypair={generateKeypair}
              selectedKeypair={selectedKeypair}
            />
          ))}
        </div>
      </div>

      <div className="oi-footer-row mt-4">
        <div className="oi-actions oi-actions--wide mx-auto">
          <Button
            className="oi-back"
            text="Back"
            icon={<ArrowLeft />}
            link="/login-selection"
            style="quiet"
            disableHoverStyle
          />
          <Button
            onClick={goToNext}
            text="Next"
            style="primary"
            icon={<ArrowRight />}
            appendIcon
            disabled={isNextDisabled()}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountSelection;
