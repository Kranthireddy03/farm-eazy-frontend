import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';

export function useToast() {
  const showToast = useCallback((message, type = 'success') => {
    if (type === 'error') sonnerToast.error(message);
    else if (type === 'warning') sonnerToast.warning(message);
    else if (type === 'info') sonnerToast.info(message);
    else sonnerToast.success(message);
  }, []);

  const closeToast = useCallback(() => {}, []);

  return { toast: null, showToast, closeToast };
}
