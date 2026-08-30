import { useEffect } from 'react';
import { useGlobalToast } from '../context/ToastContext';
import { getUserFacingErrorMessage } from '../utils/userFacingError';

/**
 * Surfaces API degradation with clear toasts instead of silent redirects to /fallback.
 */
export default function ServiceDegradedNotifier() {
  const { showToast } = useGlobalToast();

  useEffect(() => {
    const onDegraded = (event) => {
      const detail = event.detail || {};
      const message = detail.userMessage
        || getUserFacingErrorMessage(
          { response: { status: detail.status, data: { message: detail.message } }, message: detail.message },
          'A background service is temporarily unavailable. You can keep using the app.',
        );

      showToast(message, 'error');
    };

    window.addEventListener('farmeazy:service-degraded', onDegraded);
    return () => window.removeEventListener('farmeazy:service-degraded', onDegraded);
  }, [showToast]);

  return null;
}
