import {X} from 'react-feather';
import Hoc from '../Hoc';

interface IProps {
  close?: () => void;
  children: React.ReactNode;
  show: boolean;
  className?: string;
  closeOnBackgroundClick?: boolean;
  secondaryStyle?: boolean;
  hideCloseButton?: boolean;
}

export const ModalContainer = ({
  close,
  children,
  show,
  className = '',
  closeOnBackgroundClick = true,
  secondaryStyle = false,
  hideCloseButton = false,
}: IProps) => {
  return show ? (
    <Hoc
      className={`mx-auto first-place animate__animated animate__fadeIn modal-wrapper ${
        secondaryStyle ? 'secondary-style' : ''
      }`}
    >
      <div
        className="modal-background"
        onClick={closeOnBackgroundClick ? close : () => null}
      />
      <div
        className={`glass-card px-5 py-5 z-100 modal-bg mx-5 ${className} ${
          secondaryStyle ? 'secondary-style-bg' : ''
        }`}
      >
        {close && !hideCloseButton && (
          <div
            className="modal-close-button cursor-pointer"
            onClick={close}
          >
            {' '}
            <X />
          </div>
        )}
        {children}
      </div>
    </Hoc>
  ) : (
    <></>
  );
};
