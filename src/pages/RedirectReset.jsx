import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthPageLayout, AuthSidePanel } from '../components/layout/AuthPageLayout';
import AppPage from '../components/layout/AppPage';
import { InfoPanel } from '../components/platform/InfoPanel';

export default function RedirectReset() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shortCode) {
      setErrorMessage('This reset link format is no longer supported. Please request a new password reset link.');
      setLoading(false);
    } else {
      setErrorMessage('Missing reset link code. Please request a new password reset link.');
      setLoading(false);
    }
  }, [shortCode, navigate]);

  if (loading && !errorMessage) {
    return (
      <AppPage title="Password Reset" description="Verifying your secure reset link.">
        <AuthPageLayout
          title="Verifying link"
          description="Please wait while we validate your password reset link."
          side={
            <AuthSidePanel
              title="Secure recovery"
              description="Reset links are single-use and expire after one hour for your account security."
            />
          }
        >
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span>Redirecting to password reset...</span>
          </div>
        </AuthPageLayout>
      </AppPage>
    );
  }

  if (errorMessage) {
    return (
      <AppPage title="Reset Link Issue" description="This password reset link could not be used.">
        <AuthPageLayout
          title="Reset link issue"
          description="We could not use this password reset link."
          side={
            <AuthSidePanel
              title="What you can do"
              description="Request a fresh reset link from the forgot password page. Links expire after one hour and can only be used once."
            />
          }
        >
          <InfoPanel variant="destructive" title="Unable to continue" description={errorMessage} />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              to="/forgot-password"
              className="inline-flex justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90"
            >
              Request a new link
            </Link>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80"
            >
              Back to login
            </button>
          </div>
        </AuthPageLayout>
      </AppPage>
    );
  }

  return null;
}
