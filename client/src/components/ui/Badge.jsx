import clsx from 'clsx';

const badgeVariants = {
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
  secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  success: 'bg-success-100 text-success-800 border-success-200',
  warning: 'bg-warning-100 text-warning-800 border-warning-200',
  danger: 'bg-danger-100 text-danger-800 border-danger-200',
  neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200'
};

const badgeSizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5',
        'font-medium rounded-full border',
        'transition-colors duration-200',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export default Badge;
