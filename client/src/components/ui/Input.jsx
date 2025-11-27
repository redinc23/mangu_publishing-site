import { forwardRef } from 'react';
import clsx from 'clsx';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {label && (
          <label className="text-sm font-medium text-neutral-700" htmlFor={props.id}>
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'block w-full rounded-lg border px-4 py-2.5',
              'text-neutral-900 placeholder-neutral-400',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
                : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500',
              'disabled:bg-neutral-50 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        {!error && helperText && <p className="text-sm text-neutral-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
