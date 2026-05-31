import React, { useState } from 'react';
import apiClient from '../services/apiClient';
import { useTheme } from '../context/ThemeContext';
import { GlassPanel, HeroFrame, PillButton, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface';
import { PublicPageContainer, PublicNotePanel } from '../components/public/PublicPagePrimitives';

export default function RaiseTicket() {
  const { isDark } = useTheme();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(false);
    setError('');
    try {
      const gatewayClient = import.meta.env.VITE_API_GATEWAY_CLIENT || '';
      const ts = String(Date.now());
      const nonce = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `nonce-${ts}-${Math.random().toString(36).slice(2)}`;
      const config = gatewayClient ? { headers: { 'X-Gateway-Client': gatewayClient, 'X-Gateway-Timestamp': ts, 'X-Request-Nonce': nonce } } : undefined;

      await apiClient.post('/support-tickets/guest', {
        subject: subject.trim(),
        description: description.trim(),
        contactEmail: email.trim(),
      }, config);
      setSubmitted(true);
      setSubject('');
      setDescription('');
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit ticket.');
    }
  };

  return (
    <PublicPageContainer>
      <HeroFrame
        eyebrow="Support Ticket"
        title="Raise a support ticket from the public portal"
        description="Describe your issue and our support team will reach out on your email address with next steps."
        actions={(
          <>
            <PillButton to="/support" active>Back to support</PillButton>
            <PillButton to="/faq">Browse FAQ</PillButton>
          </>
        )}
        side={
          <PublicNotePanel
            eyebrow="Ticket quality"
            title="Clear context gets faster triage"
            items={[
              'Use a specific subject line',
              'Include exact page or workflow details',
              'Share expected vs actual behavior',
            ]}
          />
        }
      />

      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
        <StrongPanel className="p-6 md:p-8">
          <h1 className={`text-2xl md:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Raise a Support Ticket</h1>
          <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Describe your issue or question. Our support team will contact you via email.</p>

          {submitted && (
            <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Your ticket has been submitted successfully.</div>
          )}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-950/60 border-white/10 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'}`}
              placeholder="Subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
            <textarea
              className={`w-full px-4 py-3 rounded-lg resize-none border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-950/60 border-white/10 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'}`}
              placeholder="Describe your issue"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              required
            />
            <input
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-950/60 border-white/10 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'}`}
              placeholder="Your email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950">Submit Ticket</button>
          </form>
        </StrongPanel>

        <GlassPanel className="p-6 md:p-8">
          <SectionTitle eyebrow="What happens next" title="Ticket flow" />
          <div className="mt-5 space-y-3">
            {[
              'Ticket is logged and queued',
              'Support reviews issue severity',
              'Response is shared on email',
            ].map((item) => (
              <div key={item} className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white/80 text-slate-700'}`}>
                {item}
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </PublicPageContainer>
  );
}
