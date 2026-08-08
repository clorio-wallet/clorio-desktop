import {useState} from 'react';
import type {IInputProps} from './InputProps';
import {Eye, EyeOff} from 'react-feather';

const Input = ({
  type,
  value,
  inputHandler,
  inputFocusHandler,
  inputBlurHandler,
  placeholder,
  small,
  hidden,
  appendIcon,
  id,
  name,
  disabled,
}: IInputProps) => {
  const [showText, setShowText] = useState<boolean>(false);

  const inputTypeHandler = () => {
    if (hidden) {
      return showText ? type : 'password';
    }
    return type || 'text';
  };

  return (
    <div
      className={small ? 'small-wrap-input1 validate-input ' : 'wrap-input1 validate-input'}
      data-validate="Name is required"
    >
      <span className="icon" />
      <input
        className={`input1 ${hidden && 'show-icon'}`}
        type={inputTypeHandler()}
        value={value}
        name={name}
        id={id}
        onChange={inputHandler}
        onFocus={inputFocusHandler}
        onBlur={inputBlurHandler}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        min="0"
      />
      {appendIcon && <span className="append-icon">{appendIcon}</span>}
      {hidden && (
        <span
          className="show-hide-icon"
          data-tip={showText ? 'Hide Passphrase/Private key' : 'Show Passphrase/Private key'}
        >
          {!showText ? (
            <Eye onClick={() => setShowText(!showText)} />
          ) : (
            <EyeOff onClick={() => setShowText(!showText)} />
          )}
        </span>
      )}
      <span className="shadow-input1"></span>
    </div>
  );
};

export default Input;
