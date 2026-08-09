import {ReactNode} from 'react';
import {ModalContainer} from '../ModalContainer';
import styles from './ZkappModal.module.scss';

interface ZkappModalProps {
  show: boolean;
  close?: () => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

export function ZkappModal({
  show,
  close,
  title,
  subtitle,
  icon,
  children,
  wide = false,
}: ZkappModalProps) {
  return (
    <ModalContainer
      show={show}
      close={close}
      closeOnBackgroundClick={false}
      className={`${styles.modal} ${wide ? styles.wide : ''}`}
    >
      <header className={styles.header}>
        <div className={styles.icon} aria-hidden="true">{icon}</div>
        <div className={styles.heading}>
          <h1 id="modal-title">{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </ModalContainer>
  );
}

export function ZkappModalActions({children}: {children: ReactNode}) {
  return <div className={styles.actions}>{children}</div>;
}

export function ZkappModalDetails({
  items,
}: {
  items: Array<{label: string; value?: ReactNode; title?: string}>;
}) {
  return (
    <dl className={styles.details}>
      {items.map(item => (
        <div className={styles.detail} key={item.label}>
          <dt>{item.label}</dt>
          <dd title={item.title}>{item.value || 'Not available'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ZkappModalNotice({
  icon,
  title,
  children,
  warning = false,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <div className={`${styles.notice} ${warning ? styles.warning : ''}`}>
      {icon}
      <div>
        <strong>{title}</strong>
        <span>{children}</span>
      </div>
    </div>
  );
}

export {styles as zkappModalStyles};
