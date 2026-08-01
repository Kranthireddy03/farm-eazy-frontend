import { toast as sonnerToast } from 'sonner';

export function useToast() {
  const showToast = (message, type = 'success') => {
    if (type === 'error') sonnerToast.error(message);
    else if (type === 'warning') sonnerToast.warning(message);
    else if (type === 'info') sonnerToast.info(message);
    else sonnerToast.success(message);
  };

  return { toast: null, showToast, closeToast: () => {} };
}
