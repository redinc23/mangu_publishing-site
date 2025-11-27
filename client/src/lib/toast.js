import toast from 'react-hot-toast';

const toastConfig = {
  duration: 3000,
  position: 'top-center',
  style: {
    background: '#181818',
    color: '#fff',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: '#46d369',
      secondary: '#fff',
    },
  },
  error: {
    iconTheme: {
      primary: '#ff6b6b',
      secondary: '#fff',
    },
  },
};

export const showToast = {
  success: (message) => toast.success(message, toastConfig),
  error: (message) => toast.error(message, toastConfig),
  loading: (message) => toast.loading(message, toastConfig),
  promise: (promise, messages) =>
    toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      toastConfig
    ),
  custom: (message, options = {}) =>
    toast(message, { ...toastConfig, ...options }),
  dismiss: (toastId) => toast.dismiss(toastId),
  remove: (toastId) => toast.remove(toastId),
};

export default showToast;
