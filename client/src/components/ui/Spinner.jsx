import clsx from 'clsx';

const spinnerSizes = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-4'
};

export function Spinner({ size = 'md', className, label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label={label}>
      <div
        className={clsx(
          'animate-spin rounded-full',
          'border-neutral-200 border-t-primary-600',
          spinnerSizes[size],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Spinner;
