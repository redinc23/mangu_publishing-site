import clsx from 'clsx';

export function Card({
  children,
  header,
  footer,
  hoverable = false,
  className,
  ...props
}) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-neutral-800',
        'rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700',
        'overflow-hidden',
        hoverable && 'transition-all duration-200 hover:shadow-md hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;
