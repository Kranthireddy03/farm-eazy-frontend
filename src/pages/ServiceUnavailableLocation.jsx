import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, Send, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import apiClient from '../services/apiClient';
import LocationService from '../services/LocationService';
import { getUserFacingErrorMessage } from '../utils/userFacingError';
import { useLocationContext } from '../context/LocationContext';
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
  const { openSelector, setSelectedLocation, activeZones } = useLocationContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestCount, setRequestCount] = useState(0);

  const [form, setForm] = useState({
    city: '',
    state: '',
    postalCode: '',
    preferredService: SERVICE_OPTIONS[0],
    households: '',
    notes: '',
  });

  const accessMessage = useMemo(() => {
    return location.state?.message || 'FarmEazy is not live in your selected area yet, but our team is actively expanding.';
  }, [location.state]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get('/location-access/status');
        if (res.data && res.data.requestCount !== undefined) {
          setRequestCount(res.data.requestCount);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectActiveZone = async (zone) => {
    const payload = {
      type: 'coords',
      latitude: Number(zone.latitude || 17.385),
      longitude: Number(zone.longitude || 78.4867),
      label: `${zone.locationName} (${zone.city || zone.state})`,
      city: zone.city,
      state: zone.state,
      postalCode: zone.postalCode,
      isServiceable: true,
      matchedZoneName: zone.locationName,
      matchedZoneId: zone.id,
    };
    await setSelectedLocation(payload);
    navigate('/');
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
      // Refresh request count after successful submission
      try {
        const res = await apiClient.get('/location-access/status');
        if (res.data && res.data.requestCount !== undefined) {
          setRequestCount(res.data.requestCount);
        }
      } catch (e) {
        // ignore
      }
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
        <div className="space-y-3">
          {requestCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs text-amber-400 font-semibold">
              <Globe className="h-3.5 w-3.5" />
              <span>{requestCount} {requestCount === 1 ? 'person' : 'people'} in your area already requested launch here!</span>
            </div>
          )}
          <p className="text-sm text-slate-300">
            Operations and delivery logistics are currently active in specific operational zones configured by admin.
          </p>
        </div>
      }
      actions={
        <button
          type="button"
          onClick={() => openSelector({ blocking: true })}
          className="rounded-xl border border-amber-400 bg-amber-500/10 text-amber-400 px-4 py-2 text-sm font-semibold hover:bg-amber-500/20"
        >
          Change location
        </button>
      }
      aside={
        <div className="space-y-4">
          {activeZones && activeZones.length > 0 && (
            <ExperiencePanel
              title="Active Service Zones"
              description="Switch to one of our currently active operational hubs to browse and order:"
            >
              <div className="space-y-2 mt-2">
                {activeZones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleSelectActiveZone(zone)}
                    className="w-full text-left p-2.5 rounded-xl border border-white/10 bg-black/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                        {zone.locationName}
                      </p>
                      <p className="text-[10px] text-slate-400 ml-5">
                        {zone.city}, {zone.state} • {zone.radiusKm || 5} km radius
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </ExperiencePanel>
          )}

          <ExperiencePanel
            title="Talk to support"
            description="Live chat connects to operations and support agents. Open chat from here."
          >
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('farmeazy:open-live-chat'));
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-slate-900 font-bold py-2.5 hover:bg-amber-400"
            >
              <MessageCircle className="h-4 w-4" />
              Open live chat
            </button>
          </ExperiencePanel>
        </div>
      }
    >
      <ExperiencePanel
        title="Request service launch"
        description="Share location details so operations can prioritize rollout planning in your region."
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
                placeholder="e.g. 500001"
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
              placeholder="Tell us what products/services you need most in this area"
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
        title="Why we enforce operational zones"
        description="Delivery quality, freshness guarantee, and logistics SLA depend on defined operational radius."
      >
        <div className="flex items-start gap-3 text-sm text-slate-300">
          <MapPin className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
          <p>
            FarmEazy delivery fleets operate within verified zones configured by admin. When you are outside active zones, you can browse listings or request launch, while ordering is protected until the zone goes live.
          </p>
        </div>
      </ExperiencePanel>
    </ExperiencePageShell>
  );
}
