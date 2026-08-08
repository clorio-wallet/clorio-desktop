import {Link} from 'react-router-dom';
import styles from './Button.module.scss';

type ButtonStyle =
  | 'standard'
  | 'no-style'
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'inline'
  | 'quiet'
  | 'tint'
  | 'pill'
  | 'toolbar'
  | 'link';

type ButtonVariant = 'outlined' | 'glow' | 'pulse' | string;
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const STYLE_CLASS_MAP: Record<ButtonStyle, string> = {
  standard: styles.standard,
  'no-style': styles.noStyle,
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  danger: styles.danger,
  success: styles.success,
  inline: styles.inline,
  quiet: styles.quiet,
  tint: styles.tint,
  pill: styles.pill,
  toolbar: styles.toolbar,
  link: styles.linkStyle,
};

const SIZE_CLASS_MAP: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  icon: styles.icon,
};

const getVariantClassName = (variant?: ButtonVariant) => {
  if (!variant) {
    return '';
  }

  return styles[variant] ?? `btn btn-${variant}`;
};

interface IProps {
  className?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  text?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  link?: string;
  loading?: boolean;
  disableAnimation?: boolean;
  disableHoverStyle?: boolean;
  style?: ButtonStyle;
  appendIcon?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = ({
  className,
  type = 'button',
  onClick,
  text,
  icon,
  disabled,
  link,
  loading,
  disableAnimation,
  disableHoverStyle,
  style = 'standard',
  appendIcon = false,
  variant,
  size = 'md',
}: IProps) => {
  const clickHandler = () => {
    if (!loading && onClick) {
      onClick();
    }
  };

  const baseClasses = [
    styles.buttonBase,
    disableAnimation ? '' : styles.buttonAnimation,
    disableHoverStyle ? styles.noHoverStyle : '',
    SIZE_CLASS_MAP[size],
    STYLE_CLASS_MAP[style],
    disabled ? styles.disabled : '',
    getVariantClassName(variant),
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
    <span className={styles.buttonContent}>
      {!appendIcon && icon}
      {text}
      {appendIcon && icon}
    </span>
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
      type={type}
      className={baseClasses}
      onClick={clickHandler}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export default Button;
