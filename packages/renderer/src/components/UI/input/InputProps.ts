import {ReactNode} from 'react';

export interface IInputProps {
  type?: string;
  value?: string | number;
  inputHandler: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputFocusHandler?: () => void;
  inputBlurHandler?: () => void;
  placeholder?: string;
  small?: boolean;
  className?: string;
  name?: string;
  id?: string;
  hidden?: boolean;
  appendIcon?: ReactNode;
}
