import {Link} from 'react-router-dom';
import styles from './Button.module.scss';

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

  const baseClasses = [
    styles.buttonBase,
    disableAnimation ? '' : styles.buttonAnimation,
    style === 'primary'
      ? styles.primary
      : style === 'standard'
        ? styles.standard
        : style === 'no-style'
          ? styles.noStyle
          : '',
    disabled ? styles.disabled : '',
    variant ? `btn btn-${variant}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = loading ? (
    <span className={styles.loaderWrapper}>
      <span className="LoaderWrapper">
        <span className="LineWrapper">
          <span className="LineTop" />
        </span>
      </span>
    </span>
  ) : (
    <>
      {!appendIcon && icon}
      {text}
      {appendIcon && icon}
    </>
  );

  if (link) {
    if (disabled) {
      return <span className={baseClasses}>{content}</span>;
    }
    return (
      <Link
        to={link}
        className={baseClasses}
        onClick={clickHandler}
        role="button"
      >
        {content}
      </Link>
    );
  }

  if (style === 'no-style' && !onClick) {
    return <span className={baseClasses}>{content}</span>;
  }

  return (
    <button
      type="button"
      className={baseClasses}
      onClick={clickHandler}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export default Button;
