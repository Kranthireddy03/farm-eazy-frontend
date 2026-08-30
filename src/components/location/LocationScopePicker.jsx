import { useEffect, useState } from 'react';
import LocationService from '../../services/LocationService';
import { useToast } from '../../hooks/useToast';

/**
 * Structured location selector backed by the pincode master. Location authorization is
 * always derived server-side from these normalized values - never from free text.
 *
 * value: { scope: 'INDIA'|'STATE'|'PINCODE', state: string, pincode: string }
 */
export default function LocationScopePicker({ value, onChange, selectClass = '' }) {
  const { showToast } = useToast();
  const [states, setStates] = useState([]);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null); // derived city/district/state of chosen pincode

  const set = (patch) => onChange({ ...value, ...patch });

  useEffect(() => {
    LocationService.getStates()
      .then(setStates)
      .catch(() => showToast('Failed to load states', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const cls = `w-full px-3 py-2 rounded-md border border-input bg-background text-sm ${selectClass}`;

  return (
    <div className="space-y-2">
      <select
        className={cls}
        value={value?.scope || 'INDIA'}
        onChange={(e) => set({ scope: e.target.value, state: '', pincode: '' })}
      >
        <option value="INDIA">Entire India</option>
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
  );
}
