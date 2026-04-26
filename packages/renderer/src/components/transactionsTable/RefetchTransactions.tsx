import {useEffect, useMemo, useRef, useState} from 'react';
import {DEFAULT_REFRESH_COUNTDOWN} from '../../tools';

const RefetchTransactions = ({refetch}: {refetch: (refresh?: boolean) => void}) => {
  const [countdown, setCountdown] = useState(DEFAULT_REFRESH_COUNTDOWN);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const refetchRef = useRef(refetch);

  refetchRef.current = refetch;

  const circumference = useMemo(() => 2 * Math.PI * 12, []);
  const progress = (DEFAULT_REFRESH_COUNTDOWN - countdown) / DEFAULT_REFRESH_COUNTDOWN;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === 0) {
          refetchRef.current();
          return DEFAULT_REFRESH_COUNTDOWN;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isAboutToRefresh = countdown <= 5;
  const justFetched = countdown >= DEFAULT_REFRESH_COUNTDOWN - 5;

  const refetchAndResetTimer = async () => {
    if (justFetched) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCountdown(DEFAULT_REFRESH_COUNTDOWN);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === 0) {
          refetchRef.current();
          return DEFAULT_REFRESH_COUNTDOWN;
        }
        return prev - 1;
      });
    }, 1000);
    await refetchRef.current(true);
  };

  return (
    <button
      type="button"
      title="Refresh transactions"
      aria-label="Refresh transactions"
      onClick={refetchAndResetTimer}
      className={[
        'refetch-container',
        justFetched ? 'refetch-container--fresh' : '',
        isAboutToRefresh ? 'refetch-container--about' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="refetch-status"
        aria-live="polite"
      >
        <div className="refetch-copy-stack">
          <div
            className={`refetch-copy refetch-copy--fresh ${justFetched ? 'is-visible' : ''}`}
            aria-hidden={!justFetched}
          >
            <strong>Synced</strong>
          </div>
          <div
            className={`refetch-copy refetch-copy--countdown ${justFetched ? '' : 'is-visible'}`}
            aria-hidden={justFetched}
          >
            <strong>{countdown}s</strong>
          </div>
        </div>
        <div className="refetch-arc-wrap">
          <svg
            className="refetch-arc"
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="arc-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="#c197ff"
                />
                <stop
                  offset="100%"
                  stopColor="#f38c3e"
                />
              </linearGradient>
            </defs>
            <circle
              className="arc-bg"
              cx="16"
              cy="16"
              r="12"
            />
            <circle
              className="arc-progress"
              cx="16"
              cy="16"
              r="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span className="refetch-arc-core" />
        </div>
      </div>
    </button>
  );
};

export default RefetchTransactions;
