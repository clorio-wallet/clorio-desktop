import {useMemo, useState} from 'react';
import type {ChangeEvent, ReactNode} from 'react';
import {Eye, EyeOff} from 'react-feather';
import styles from './TextField.module.scss';

interface TextFieldProps {
  type?: string;
  value?: string | number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  hidden?: boolean;
  appendIcon?: ReactNode;
}

export default function TextField({
  type,
  value,
  onChange,
  placeholder,
  className,
  hidden,
  appendIcon,
}: TextFieldProps) {
  const [showText, setShowText] = useState(false);

  const inputType = useMemo(() => {
    if (hidden) {
      return showText ? type ?? 'text' : 'password';
    }
    return type ?? 'text';
  }, [hidden, showText, type]);

  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <input
        className={styles.input}
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
      {(appendIcon || hidden) && (
        <span className={styles.appendIcon}>
          {appendIcon}
          {hidden &&
            (!showText ? (
              <Eye
                className={styles.toggleIcon}
                onClick={() => setShowText(true)}
              />
            ) : (
              <EyeOff
                className={styles.toggleIcon}
                onClick={() => setShowText(false)}
              />
            ))}
        </span>
      )}
    </div>
  );
}

