import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'info', ...options });
    },
    [addToast]
  );

  toast.success = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'success', ...options });
    },
    [addToast]
  );

  toast.error = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'error', ...options });
    },
    [addToast]
  );

  toast.warning = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'warning', ...options });
    },
    [addToast]
  );

  toast.info = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'info', ...options });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {createPortal(<ToastContainer toasts={toasts} onRemove={removeToast} />, document.body)}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[1070] flex flex-col gap-2 pointer-events-none max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const { id, type, message, title } = toast;

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const styles = {
    success: 'bg-success-50 text-success-800 border-success-200',
    error: 'bg-danger-50 text-danger-800 border-danger-200',
    warning: 'bg-warning-50 text-warning-800 border-warning-200',
    info: 'bg-primary-50 text-primary-800 border-primary-200'
  };

  const iconColors = {
    success: 'text-success-500',
    error: 'text-danger-500',
    warning: 'text-warning-500',
    info: 'text-primary-500'
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto',
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'animate-slide-in-right',
        'min-w-[300px] max-w-md',
        styles[type]
      )}
    >
      <div className={clsx('flex-shrink-0', iconColors[type])}>{icons[type]}</div>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ToastProvider;
