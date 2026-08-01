import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../config/api';

export default function RedirectReset() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullToken = async () => {
      try {
        const response = await api.get(`/auth/r/${shortCode}`);
        const fullToken = response.data.token;

        navigate(`/reset-password?token=${fullToken}`, { replace: true });
        return;
      } catch (error) {
        const status = error.response?.status;
        const apiMessage = error.response?.data?.message;
        let message = apiMessage || 'Invalid or expired reset link.';

        if (status === 409) {
          message = apiMessage || 'This reset link has already been used. Your password was already reset. Please request a new link after 24 hours.';
        } else if (status === 410) {
          message = apiMessage || 'This reset link has expired. Please request a new password reset link.';
        }

        console.error('Failed to resolve reset link:', apiMessage || error.message, error);
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    if (shortCode) {
      fetchFullToken();
    } else {
      setErrorMessage('Missing reset link code. Please request a new password reset link.');
      setLoading(false);
    }
  }, [shortCode, navigate]);

  if (loading && !errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to password reset...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4 py-8">
        <div className="w-full max-w-xl bg-background rounded-3xl shadow-2xl border border-border p-8 text-center">
          <div className="mb-6 text-5xl">🔒</div>
          <h1 className="text-3xl font-bold mb-4 text-foreground">Reset Link Issue</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/forgot-password"
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90"
            >
              Request a new link
            </Link>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
