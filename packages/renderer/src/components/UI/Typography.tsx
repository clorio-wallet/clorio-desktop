import type {ElementType, ReactNode} from 'react';
import styles from './Typography.module.scss';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption';
type TypographyAlign = 'left' | 'center' | 'right';

interface TypographyProps {
  variant: TypographyVariant;
  as?: keyof JSX.IntrinsicElements;
  align?: TypographyAlign;
  className?: string;
  children: ReactNode;
}

const defaultTagByVariant: Record<TypographyVariant, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  caption: 'span',
};

const alignClass: Record<TypographyAlign, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
};

export default function Typography({
  variant,
  as,
  align = 'left',
  className,
  children,
}: TypographyProps) {
  const Tag: ElementType = as ?? defaultTagByVariant[variant];
  const classes = [styles.base, styles[variant], alignClass[align], className ?? '']
    .filter(Boolean)
    .join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
