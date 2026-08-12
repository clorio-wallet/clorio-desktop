import {memo, useCallback} from 'react';
import {X} from 'react-feather';

interface IProps {
  close?: () => void;
  children: React.ReactNode;
  show: boolean;
  className?: string;
  closeOnBackgroundClick?: boolean;
}

export const ModalContainer = memo(function ModalContainer({
  close,
  children,
  show,
  className = '',
  closeOnBackgroundClick = true,
}: IProps) {
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackgroundClick && close) {
      close();
    }
  }, [closeOnBackgroundClick, close]);

  if (!show) {
    return null;
  }

  return (
    <div
      className="modal-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-background"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div className={`modal-content ${className}`}>
        {close && (
          <button
            type="button"
            className="modal-close-button"
            onClick={close}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
});
