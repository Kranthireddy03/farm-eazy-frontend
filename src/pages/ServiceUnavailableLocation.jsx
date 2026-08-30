import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, Send } from 'lucide-react';
import apiClient from '../services/apiClient';
import { getUserFacingErrorMessage } from '../utils/userFacingError';
import {
  ExperienceAlert,
  ExperiencePageShell,
  ExperiencePanel,
} from '../components/experience/ExperiencePageShell';

const SERVICE_OPTIONS = [
  'Fresh produce delivery',
  'Farm input supplies',
  'Vendor marketplace',
  'Irrigation services',
  'All FarmEazy services',
];

export default function ServiceUnavailableLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    city: '',
    state: '',
    postalCode: '',
    preferredService: SERVICE_OPTIONS[0],
    households: '',
    notes: '',
  });

  const accessMessage = useMemo(() => {
    return location.state?.message || 'FarmEazy is not live in your area yet, but we are expanding.';
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitLaunchRequest = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.city.trim() || !form.state.trim()) {
      setError('City and state are required so our operations team can prioritize your area.');
      return;
    }

    const subject = `Location Launch Request: ${form.city.trim()}, ${form.state.trim()}`;
    const description = [
      'User requested FarmEazy launch in a non-serviceable location.',
      `City: ${form.city.trim()}`,
      `State: ${form.state.trim()}`,
      `Postal Code: ${form.postalCode?.trim() || 'Not provided'}`,
      `Preferred Service: ${form.preferredService}`,
      `Estimated Households Interested: ${form.households || 'Not provided'}`,
      `Additional Notes: ${form.notes?.trim() || 'None'}`,
    ].join('\n');

    try {
      setSaving(true);
      await apiClient.post('/service-requests', {
        category: 'OTHER',
        priority: 'MEDIUM',
        subject,
        description,
      });
      setSuccess('Launch request submitted. Our team will evaluate this location and contact you with updates.');
      setForm((prev) => ({
        ...prev,
        postalCode: '',
        households: '',
        notes: '',
      }));
    } catch (err) {
      setError(getUserFacingErrorMessage(err, 'Unable to submit your launch request right now.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExperiencePageShell
      variant="expansion"
      badge="Location expansion"
      title="FarmEazy is growing toward you"
      description={accessMessage}
      meta={
        <p>
          Marketplace buying may be paused here, but you can still manage farms, chat with support, and track launch requests.
        </p>
      }
      actions={
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
        >
          Back to dashboard
        </button>
      }
      aside={
        <ExperiencePanel
          title="Talk to support"
          description="Live chat on the main app connects to agents on the support portal (port 5173). Open chat from the dashboard."
        >
          <button
            type="button"
            onClick={() => {
              navigate('/dashboard');
              window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent('farmeazy:open-live-chat'));
              }, 400);
            }}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-900 font-bold py-2.5 hover:bg-amber-400"
          >
            <MessageCircle className="h-4 w-4" />
            Open live chat
          </button>
        </ExperiencePanel>
      }
    >
      <ExperiencePanel
        title="Request service launch"
        description="Share location details so operations can prioritize rollout planning."
      >
        <form className="space-y-4" onSubmit={submitLaunchRequest}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-semibold text-slate-200">City</span>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                placeholder="Your city"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-200">State</span>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                placeholder="Your state"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-semibold text-slate-200">Postal code</span>
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-200">Interested households</span>
              <input
                name="households"
                type="number"
                min="1"
                value={form.households}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-semibold text-slate-200">Preferred service</span>
            <select
              name="preferredService"
              value={form.preferredService}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
            >
              {SERVICE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-semibold text-slate-200">Additional notes</span>
            <textarea
              name="notes"
              rows={4}
              value={form.notes}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
              placeholder="Tell us what you need most in this area"
            />
          </label>

          {error && <ExperienceAlert tone="error">{error}</ExperienceAlert>}
          {success && <ExperienceAlert tone="success">{success}</ExperienceAlert>}

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold py-3"
          >
            <Send className="h-4 w-4" />
            {saving ? 'Submitting…' : 'Submit launch request'}
          </button>
        </form>
      </ExperiencePanel>

      <ExperiencePanel
        title="Why we ask for location"
        description="Accurate service boundaries protect delivery quality, vendor eligibility, and irrigation pilot coverage."
      >
        <div className="flex items-start gap-3 text-sm text-slate-300">
          <MapPin className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
          <p>
            If your pin is outside our service map, you will see this page instead of a broken checkout or empty marketplace.
            Set a different saved address from the location wizard when your area goes live.
          </p>
        </div>
      </ExperiencePanel>
    </ExperiencePageShell>
  );
}
