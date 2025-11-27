import { forwardRef } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

export const Checkbox = forwardRef(
  (
    {
      label,
      error,
      helperText,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only peer"
              {...props}
            />
            <div
              className={clsx(
                'w-5 h-5 rounded border-2 transition-all',
                'flex items-center justify-center',
                'peer-checked:bg-primary-600 peer-checked:border-primary-600',
                'peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-1',
                error
                  ? 'border-danger-300'
                  : 'border-neutral-300',
                'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
                className
              )}
            >
              <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
            </div>
          </div>
          {label && <span className="text-sm text-neutral-700">{label}</span>}
        </label>
        {error && <p className="text-sm text-danger-600 ml-7">{error}</p>}
        {!error && helperText && <p className="text-sm text-neutral-500 ml-7">{helperText}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
