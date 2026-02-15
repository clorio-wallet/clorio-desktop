import {isElectron} from '/@/tools/environment';
import { useState } from 'react';
import { X } from 'react-feather';

export const ClorioAppBanner = () => {
  const [show, setShow] = useState(true);
  return !isElectron() ? (
    <div
      className={`clorio-app-banner animate__animated animate__fadeInDown ${
        !show ? 'animate__fadeOutUp' : ''
      }`}
    >
      <div>
        <div>
          <p>
            To enhance your security we recommend to download Clorio Desktop.
          </p>
          <p>
            Download Clorio Desktop{' '}
            <a
              href={import.meta.env.VITE_REACT_APP_GITHUB_RELEASE_URL}
              target="_blank"
              rel="noreferrer"
            >
              here.
            </a>
          </p>
        </div>
        <div className="close-button" onClick={() => setShow(false)}>
          <X />
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
};
