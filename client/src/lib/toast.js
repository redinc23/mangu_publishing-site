import toast from 'react-hot-toast';

/**
 * Toast notification utility using react-hot-toast
 * Provides consistent toast notifications across the application
 */

const defaultOptions = {
  duration: 3000,
  position: 'top-center',
  style: {
    background: '#333',
    color: '#fff',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
  },
};

const showToast = {
  /**
   * Show a success toast
   * @param {string} message - The success message to display
   * @param {object} options - Additional toast options
   */
  success: (message, options = {}) => {
    toast.success(message, {
      ...defaultOptions,
      ...options,
      icon: '✅',
      style: {
        ...defaultOptions.style,
        background: '#10b981',
        ...options.style,
      },
    });
  },

  /**
   * Show an error toast
   * @param {string} message - The error message to display
   * @param {object} options - Additional toast options
   */
  error: (message, options = {}) => {
    toast.error(message, {
      ...defaultOptions,
      duration: 4000,
      ...options,
      icon: '❌',
      style: {
        ...defaultOptions.style,
        background: '#ef4444',
        ...options.style,
      },
    });
  },

  /**
   * Show an info toast
   * @param {string} message - The info message to display
   * @param {object} options - Additional toast options
   */
  info: (message, options = {}) => {
    toast(message, {
      ...defaultOptions,
      ...options,
      icon: 'ℹ️',
      style: {
        ...defaultOptions.style,
        background: '#3b82f6',
        ...options.style,
      },
    });
  },

  /**
   * Show a warning toast
   * @param {string} message - The warning message to display
   * @param {object} options - Additional toast options
   */
  warning: (message, options = {}) => {
    toast(message, {
      ...defaultOptions,
      ...options,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        background: '#f59e0b',
        ...options.style,
      },
    });
  },

  /**
   * Show a loading toast
   * @param {string} message - The loading message to display
   * @param {object} options - Additional toast options
   * @returns {string} - Toast ID for dismissal
   */
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   * @param {string} toastId - Optional toast ID to dismiss specific toast
   */
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  /**
   * Show a promise toast (automatically handles loading, success, and error states)
   * @param {Promise} promise - The promise to track
   * @param {object} messages - Object with loading, success, and error messages
   * @param {object} options - Additional toast options
   */
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        ...defaultOptions,
        ...options,
      }
    );
  },
};

export default showToast;
