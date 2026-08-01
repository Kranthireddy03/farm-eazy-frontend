import { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import apiClient from '../services/apiClient';
import AppPage from '../components/layout/AppPage';
import { DetailPanel } from '../components/platform/DetailPanel';
import { InfoPanel } from '../components/platform/InfoPanel';
import { Button } from '../components/ui/button';
import { PageSkeleton } from '../components/ui/Skeleton';
import ChangeContact from '../components/Account/ChangeContact';

export default function ContactSettings() {
  const [contact, setContact] = useState({ email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [activeChange, setActiveChange] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await apiClient.get('/account/contact');
        if (!mounted) return;
        setContact({ email: resp.data?.email || '', phone: resp.data?.phone || '' });
      } catch {
        if (mounted) setErrorMessage('Unable to load contact details');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const loadContact = async () => {
    try {
      const resp = await apiClient.get('/account/contact');
      setContact({ email: resp.data?.email || '', phone: resp.data?.phone || '' });
    } catch {
      setErrorMessage('Unable to reload contact details.');
    }
  };

  const handleSuccess = async (type) => {
    setStatusMessage(
      type === 'email' ? 'Email updated successfully.' : 'Phone number updated successfully.',
    );
    setActiveChange(null);
    await loadContact();
  };

  return (
    <AppPage
      title="Contact details"
      description="Manage your primary email and phone. Changes require OTP verification on both old and new contacts."
    >
      {statusMessage && (
        <InfoPanel variant="success" title="Updated" description={statusMessage} className="mb-4" />
      )}
      {errorMessage && (
        <InfoPanel variant="destructive" title="Error" description={errorMessage} className="mb-4" />
      )}

      {loading ? (
        <PageSkeleton variant="cards" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DetailPanel
              title="Primary email"
              description="Used for sign-in, receipts, and security alerts."
              actions={
                <Button
                  variant={activeChange === 'email' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setActiveChange(activeChange === 'email' ? null : 'email')}
                >
                  {activeChange === 'email' ? 'Cancel' : 'Change email'}
                </Button>
              }
            >
              <p className="text-base font-semibold text-foreground break-words">
                {contact.email || 'Not set'}
              </p>
              {activeChange === 'email' && (
                <div className="mt-4 border-t border-border pt-4">
                  <ChangeContact
                    type="email"
                    currentValue={contact.email}
                    onSuccess={() => handleSuccess('email')}
                  />
                </div>
              )}
            </DetailPanel>

            <DetailPanel
              title="Primary phone"
              description="Used for OTP login and order updates."
              actions={
                <Button
                  variant={activeChange === 'phone' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setActiveChange(activeChange === 'phone' ? null : 'phone')}
                >
                  {activeChange === 'phone' ? 'Cancel' : 'Change phone'}
                </Button>
              }
            >
              <p className="text-base font-semibold text-foreground break-words">
                {contact.phone || 'Not set'}
              </p>
              {activeChange === 'phone' && (
                <div className="mt-4 border-t border-border pt-4">
                  <ChangeContact
                    type="phone"
                    currentValue={contact.phone}
                    onSuccess={() => handleSuccess('phone')}
                  />
                </div>
              )}
            </DetailPanel>
          </div>

          <InfoPanel
            title="Verification flow"
            description="Two-step OTP for every contact change."
            variant="info"
          >
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                Confirm ownership on your current contact first.
              </li>
              <li className="flex gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                Then verify the new email or phone before saving.
              </li>
            </ul>
          </InfoPanel>
        </div>
      )}
    </AppPage>
  );
}
