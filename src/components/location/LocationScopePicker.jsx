import { useEffect, useState, useMemo } from 'react';
import LocationService from '../../services/LocationService';
import { useToast } from '../../hooks/useToast';
import { AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';

/**
 * Structured location selector backed by the pincode master and verified against active zones.
 *
 * value: { scope: 'INDIA'|'STATE'|'PINCODE', state: string, pincode: string }
 */
export default function LocationScopePicker({ value, onChange, selectClass = '' }) {
  const { showToast } = useToast();
  const [states, setStates] = useState([]);
  const [activeZones, setActiveZones] = useState([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null); // derived city/district/state of chosen pincode
  const [zoneCheck, setZoneCheck] = useState(null);

  const set = (patch) => onChange({ ...value, ...patch });

  useEffect(() => {
    LocationService.getStates()
      .then(setStates)
      .catch(() => showToast('Failed to load states', 'error'));

    LocationService.getActiveZones()
      .then(setActiveZones)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time verification of selected scope against active delivery zones
  useEffect(() => {
    let active = true;
    const verifyScope = async () => {
      if (!value?.scope || value.scope === 'INDIA') {
        setZoneCheck(null);
        return;
      }

      if (value.scope === 'STATE' && !value.state) {
        setZoneCheck(null);
        return;
      }

      if (value.scope === 'PINCODE' && !value.pincode) {
        setZoneCheck(null);
        return;
      }

      const res = await LocationService.checkLocationStatus({
        state: value.state || null,
        postalCode: value.pincode || null,
      });

      if (active) {
        setZoneCheck(res);
      }
    };

    verifyScope();
    return () => { active = false; };
  }, [value?.scope, value?.state, value?.pincode]);

  useEffect(() => {
    const q = query.trim();
    if (value?.scope !== 'PINCODE' || q.length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      LocationService.searchPincodes(q)
        .then((list) => { if (active) setSuggestions(list); })
        .catch(() => {});
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [query, value?.scope]);

  const choose = (p) => {
    set({ pincode: p.pincode, state: p.state || value.state });
    setPicked(p);
    setQuery(p.pincode);
    setOpen(false);
  };

  const chooseActiveZone = (zone) => {
    if (zone.postalCode) {
      set({ scope: 'PINCODE', pincode: zone.postalCode, state: zone.state });
      setPicked({ pincode: zone.postalCode, city: zone.city, district: zone.state, state: zone.state });
      setQuery(zone.postalCode);
    } else if (zone.state) {
      set({ scope: 'STATE', state: zone.state, pincode: '' });
    }
  };

  const cls = `w-full px-3 py-2 rounded-md border border-input bg-background text-sm ${selectClass}`;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <select
          className={cls}
          value={value?.scope || 'INDIA'}
          onChange={(e) => set({ scope: e.target.value, state: '', pincode: '' })}
        >
          <option value="INDIA">Entire India (Standard)</option>
          <option value="STATE">State only</option>
          <option value="PINCODE">Specific pincode</option>
        </select>

        {value?.scope === 'STATE' && (
          <select
            className={cls}
            value={value.state || ''}
            onChange={(e) => set({ state: e.target.value, pincode: '' })}
          >
            <option value="">Select state…</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {value?.scope === 'PINCODE' && (
          <div className="relative">
            <input
              className={cls}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Search pincode, city or district…"
            />
            {open && suggestions.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 rounded-md border border-border bg-background shadow-lg max-h-56 overflow-auto">
                {suggestions.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => choose(p)}
                    >
                      <span className="font-semibold">{p.pincode}</span> — {p.city}, {p.district}, {p.state}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {picked && (
              <p className="text-xs text-muted-foreground mt-1">
                {picked.pincode} — {picked.city}, {picked.district}, {picked.state}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Active Zone Verification Feedback & Highlighting */}
      {zoneCheck && (
        <div className="animate-fadeIn">
          {zoneCheck.allowed ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                ✓ Matches active service zone: <strong>{zoneCheck.matchedLocationName}</strong>
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  ⚠️ Location outside active delivery zones configured by operations.
                </span>
              </div>
              <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px]">
                Customers outside active zones will see that delivery is not yet available in this area until admin enables it.
              </p>

              {activeZones.length > 0 && (
                <div className="pt-1.5 border-t border-amber-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 block mb-1">
                    Quick-pick active zone:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeZones.map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => chooseActiveZone(z)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-500/30 transition flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        {z.locationName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
