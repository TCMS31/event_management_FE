import React, { useEffect, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { subscribeToNotifications } from '../services/notify';

/** Renders whatever `notify` publishes, stacked in the top-right corner. */
const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(
    () => subscribeToNotifications((toast) => setToasts((current) => [...current, toast])),
    []
  );

  const dismiss = (id) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <ToastContainer position="top-end" containerPosition="fixed" className="app-toasts p-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          className={`app-toast app-toast--${toast.variant}`}
          onClose={() => dismiss(toast.id)}
          delay={toast.timeout}
          autohide
        >
          <Toast.Header closeLabel="Dismiss notification">
            <strong className="me-auto">{toast.title}</strong>
          </Toast.Header>
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default Toaster;
