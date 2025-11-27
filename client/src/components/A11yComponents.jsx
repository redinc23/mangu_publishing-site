import React, { forwardRef } from 'react';
import { useAccessibleClick, useReducedMotion } from '../hooks/useA11y';

/**
 * Accessible Button Component with keyboard support
 */
export const AccessibleButton = forwardRef(({ 
  children, 
  onClick, 
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  variant = 'primary',
  ...props 
}, ref) => {
  const clickProps = useAccessibleClick(onClick);
  const prefersReducedMotion = useReducedMotion();

  const baseClasses = 'px-4 py-2 rounded-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all';
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  };
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  const transitionClass = prefersReducedMotion ? '' : 'duration-200';

  return (
    <button
      ref={ref}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? disabledClasses : ''} ${transitionClass} ${className}`}
      {...(disabled ? {} : clickProps)}
      {...props}
    >
      {children}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

/**
 * Visually Hidden Component (Screen reader only)
 */
export const VisuallyHidden = ({ children, as: Component = 'span', ...props }) => {
  return (
    <Component
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap'
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Skip Link Component
 */
export const SkipLink = ({ targetId = 'main-content', children = 'Skip to main content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        e.target.style.cssText = `
          position: fixed;
          left: 0;
          top: 0;
          width: auto;
          height: auto;
          overflow: visible;
          background: #667eea;
          color: white;
          padding: 0.75rem 1rem;
          text-decoration: none;
          border-radius: 0 0 4px 0;
          z-index: 100;
        `;
      }}
      onBlur={(e) => {
        e.target.style.cssText = `
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        `;
      }}
    >
      {children}
    </a>
  );
};

/**
 * Live Region Component for announcements
 */
export const LiveRegion = forwardRef(({ 
  children, 
  priority = 'polite',
  atomic = true,
  relevant = 'additions text',
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      {...props}
    >
      {children}
    </div>
  );
});

LiveRegion.displayName = 'LiveRegion';

/**
 * Accessible Card Component with keyboard navigation
 */
export const AccessibleCard = forwardRef(({ 
  children, 
  onClick,
  href,
  title,
  description,
  className = '',
  interactive = true,
  ...props 
}, ref) => {
  const clickProps = useAccessibleClick(onClick || (() => {}));
  const prefersReducedMotion = useReducedMotion();

  const baseClasses = 'rounded-lg shadow-md p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
  const interactiveClasses = interactive ? 'hover:shadow-lg cursor-pointer' : '';
  const transitionClass = prefersReducedMotion ? '' : 'transition-shadow duration-200';

  const cardContent = (
    <>
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {children}
    </>
  );

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={`${baseClasses} ${interactiveClasses} ${transitionClass} ${className} block`}
        {...props}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div
      ref={ref}
      className={`${baseClasses} ${interactiveClasses} ${transitionClass} ${className}`}
      {...(interactive && onClick ? clickProps : {})}
      {...props}
    >
      {cardContent}
    </div>
  );
});

AccessibleCard.displayName = 'AccessibleCard';

/**
 * Form Field Component with accessibility labels
 */
export const FormField = forwardRef(({
  label,
  error,
  hint,
  required = false,
  children,
  id,
  className = '',
  ...props
}, ref) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-field ${className}`} {...props}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-500 mb-2">
          {hint}
        </p>
      )}
      
      {React.cloneElement(children, {
        ref,
        id: fieldId,
        'aria-invalid': !!error,
        'aria-describedby': describedBy,
        'aria-required': required,
      })}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

/**
 * Loading Spinner with accessibility
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  label = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`inline-flex items-center ${className}`} role="status" aria-live="polite">
      <svg
        className={`animate-spin ${sizeClasses[size]} text-indigo-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  );
};

/**
 * Breadcrumb navigation with accessibility
 */
export const Breadcrumb = ({ items = [], ariaLabel = 'Breadcrumb' }) => {
  return (
    <nav aria-label={ariaLabel} className="flex">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.href || index} className="flex items-center">
              {index > 0 && (
                <span className="text-gray-400 mx-2" aria-hidden="true">/</span>
              )}
              {isLast ? (
                <span 
                  className="text-gray-900 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="text-indigo-600 hover:text-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
