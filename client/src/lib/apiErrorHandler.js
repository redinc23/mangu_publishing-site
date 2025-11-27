import toast from 'react-hot-toast';

/**
 * Handle API errors and show appropriate user-friendly messages
 * @param {Error} error - The error object from the API call
 * @param {string} defaultMessage - Default message to show if no specific error message is available
 * @returns {string} The error message that was displayed
 */
export const handleApiError = (error, defaultMessage = 'Something went wrong') => {
  let message = defaultMessage;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        message = data?.message || 'Invalid request. Please check your input.';
        break;
      case 401:
        message = 'Please sign in to continue.';
        // Optionally redirect to sign in page
        if (window.location.pathname !== '/signin') {
          setTimeout(() => {
            window.location.href = '/signin';
          }, 2000);
        }
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = data?.message || 'The requested resource was not found.';
        break;
      case 429:
        message = 'Too many requests. Please try again later.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        message = 'Server error. Please try again later.';
        break;
      default:
        message = data?.message || defaultMessage;
    }
  } else if (error.request) {
    // The request was made but no response was received
    message = 'Network error. Please check your connection and try again.';
  } else {
    // Something happened in setting up the request that triggered an Error
    message = error.message || defaultMessage;
  }

  toast.error(message);
  return message;
};

/**
 * Wrapper for async API calls with automatic error handling
 * @param {Function} apiCall - The async function to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise} The result of the API call or null if error
 */
export const withErrorHandling = async (
  apiCall,
  {
    errorMessage = 'Operation failed',
    showErrorToast = true,
    onError = null
  } = {}
) => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    if (showErrorToast) {
      handleApiError(error, errorMessage);
    }
    if (onError) {
      onError(error);
    }
    return null;
  }
};

/**
 * Create a retry wrapper for API calls
 * @param {Function} apiCall - The async function to execute
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} The result of the API call
 */
export const withRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry on 4xx errors (client errors)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};

export default {
  handleApiError,
  withErrorHandling,
  withRetry,
};
