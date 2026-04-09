import React, { createContext, useContext, useState, useCallback } from "react";
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from "@heroicons/react/24/outline";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Simple replacement for window.confirm (using a different state for simplicity)
  const [confirmData, setConfirmData] = useState(null);
  
  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmData({ message, resolve });
    });
  }, []);

  const handleConfirm = (value) => {
    if (confirmData) {
      confirmData.resolve(value);
      setConfirmData(null);
    }
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, confirm }}>
      {children}
      
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <div className="toast__icon">
              {t.type === "success" && <CheckCircleIcon width={20} height={20} />}
              {t.type === "error" && <XMarkIcon width={20} height={20} />}
              {t.type === "warning" && <ExclamationCircleIcon width={20} height={20} />}
              {t.type === "info" && <InformationCircleIcon width={20} height={20} />}
            </div>
            <div className="toast__message">{t.message}</div>
            <button className="toast__close" onClick={() => removeToast(t.id)}>
              <XMarkIcon width={14} height={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmData && (
        <div className="confirm-overlay" onClick={() => handleConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal__icon">
              <ExclamationCircleIcon width={32} height={32} />
            </div>
            <h3>Confirmation</h3>
            <p>{confirmData.message}</p>
            <div className="confirm-modal__actions">
              <button className="btn-confirm-cancel" onClick={() => handleConfirm(false)}>Annuler</button>
              <button className="btn-confirm-ok" onClick={() => handleConfirm(true)}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
