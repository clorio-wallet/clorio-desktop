import {Link} from 'react-router-dom';

interface IProps {
  className?: string;
  onClick?: () => void;
  text?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  link?: string;
  loading?: boolean;
  disableAnimation?: boolean;
  style?: 'standard' | 'no-style' | 'primary';
  appendIcon?: boolean;
  variant?: string;
}

const Button = ({
  className,
  onClick,
  text,
  icon,
  disabled,
  link,
  loading,
  disableAnimation,
  style = 'standard',
  appendIcon = false,
  variant,
}: IProps) => {
  const clickHandler = () => {
    if (loading) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const styleClass =
    style === 'standard'
      ? 'button non-selectable-text'
      : style === 'primary'
        ? `primary ${disabled ? 'primary disabled' : ''}`
        : '';

  const button = (
    <div
      className={`${className} ${disableAnimation ? '' : ' button-animation '}  ${styleClass} ${
        variant ? `btn btn-${variant}` : ''
      }`}
      onClick={clickHandler}
    >
      {loading ? (
        <div className="LoaderWrapper">
          <div className="LineWrapper">
            <div className="LineTop" />
          </div>
        </div>
      ) : (
        <>
          {!appendIcon && icon} &nbsp; {text} &nbsp; {appendIcon && icon}
        </>
      )}
    </div>
  );

  const disabledButton = (
    <div
      className={`${className} ${disableAnimation ? '' : ' button-animation '}  ${styleClass} ${
        variant ? `btn btn-${variant}` : ''
      }`}
    >
      {!appendIcon && icon} &nbsp; {text} &nbsp; {appendIcon && icon}
    </div>
  );
  if (disabled) {
    return disabledButton;
  }
  return link ? <Link to={link}> {button} </Link> : button;
};

export default Button;
