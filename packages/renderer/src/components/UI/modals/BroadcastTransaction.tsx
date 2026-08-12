import {useEffect, useState} from 'react';
import Animation from '../Animation';
import BroadcastingAnimation from './assets/broadcasting.json';

const BROADCASTING_MESSAGES = [
  'Encrypting your transaction...',
  'Connecting to the Mina network...',
  'Your transaction is on its way...',
  'Almost there...',
  'Finalizing your transfer...',
];

const INFINITE_TIMEOUT = 99999999;

export const BroadcastTransaction = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeMessage, setFadeMessage] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeMessage(false);
      setTimeout(() => {
        setMessageIndex(prev => (prev + 1) % BROADCASTING_MESSAGES.length);
        setFadeMessage(true);
      }, 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="broadcast-container">
      <div className="broadcast-animation-wrapper">
        <Animation
          animation={BroadcastingAnimation}
          maxWidth="700px"
          timeout={INFINITE_TIMEOUT}
        />
      </div>
      <div className="broadcast-status">
        <div className="broadcast-dots">
          <span className="broadcast-dot" />
          <span className="broadcast-dot" />
          <span className="broadcast-dot" />
        </div>
        <p className={`broadcast-message ${fadeMessage ? 'visible' : 'faded'}`}>
          {BROADCASTING_MESSAGES[messageIndex]}
        </p>
      </div>
      <p className="broadcast-hint">
        This usually takes a few seconds
      </p>
    </div>
  );
};
