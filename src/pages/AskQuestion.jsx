import { useState } from 'react';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { getApiErrorMessage } from '../utils/apiError';
import { unwrapApiData } from '../utils/apiResponse';
import { useTheme } from '../context/ThemeContext';
import { GlassPanel, HeroFrame, PillButton, SectionTitle, StrongPanel } from '../components/ui/PremiumSurface'
import { PublicPageContainer, PublicNotePanel } from '../components/public/PublicPagePrimitives';

export default function AskQuestion() {
  const { isDark } = useTheme();
  const { toast, showToast, closeToast } = useToast();
  const [question, setQuestion] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [faqCongrats, setFaqCongrats] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(false);
    setError('');
    setResponse('');
    try {
      const res = await apiClient.post('/faq/question', { question, email, source: 'FAQ_USER_PUBLIC_PAGE' });
      const body = unwrapApiData(res.data);
      const message = typeof body === 'string'
        ? body
        : body?.message || 'Your question has been submitted successfully.';
      setSubmitted(true);
      setResponse(message);
      setQuestion('');
      setEmail('');
      setFaqCongrats(false);
      showToast('Your question was submitted and is being reviewed by admins. You will receive an answer soon.', 'info');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit question.');
      setError(message);
      showToast(message, 'error');
    }
  };

  const navigate = useNavigate();
  return (
    <PublicPageContainer>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      <div className="space-y-6">
        <HeroFrame
          eyebrow="Ask a Question"
          title="If the FAQ does not cover it, send it here."
          description="Our admin team will reply via email. If your question is valuable, it may be added to the FAQ for others."
          actions={(
            <>
              <PillButton to="/support/ticket" active>Raise a support ticket</PillButton>
              <PillButton to="/faq">Browse FAQ</PillButton>
            </>
          )}
          side={(
            <PublicNotePanel
              eyebrow="How this helps"
              title="The question flow stays short and traceable"
              items={[
                'Keep the request focused and actionable',
                'Route the message into the support workflow',
                'Surface helpful questions back into the FAQ',
              ]}
            />
          )}
        />

        <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-6 items-start">
          <StrongPanel className="w-full max-w-none p-6 md:p-8">
            <h1 className={`text-2xl md:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-foreground'}`}>Ask a Question</h1>
            <p className={`mb-4 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`}>
              If your question is not answered in the FAQ, submit it below. Our admin team will reply via email. If your question is valuable, it may be added to the FAQ for others.
            </p>

            {submitted && (
              <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                {faqCongrats ? (
                  <>
                    <div>Congratulations. Your question was added to the FAQ. Thank you for contributing.</div>
                    <div className="mt-2">You can ask more questions anytime.</div>
                  </>
                ) : (
                  <>
                    <div>{typeof response === 'string' ? response : 'Thank you for your question. Our admin team will reply via email.'}</div>
                    <div className="mt-2">You can ask more questions anytime. If your question is valuable, it may be added to the FAQ.</div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-primary ${isDark ? 'bg-background/60 border-white/10 text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'}`}
                placeholder="Your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <textarea
                className={`w-full px-4 py-3 rounded-lg resize-none border focus:ring-2 focus:ring-primary ${isDark ? 'bg-background/60 border-white/10 text-white placeholder:text-muted-foreground' : 'bg-background border-border text-foreground placeholder:text-muted-foreground'}`}
                placeholder="Type your question here"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={5}
                minLength={10}
                maxLength={1000}
                required
              />
              <button type="submit" className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-primary/50 to-cyan-500 hover:from-primary hover:to-primary/80 text-foreground">Submit Question</button>
            </form>

            <div className={`mt-6 text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              If you need further help,{' '}
              <button className="text-blue-600 dark:text-blue-400 underline" onClick={() => navigate('/support/ticket')}>
                raise a support ticket
              </button>.
            </div>
          </StrongPanel>

          <GlassPanel className="w-full max-w-none p-6 md:p-8">
            <SectionTitle eyebrow="Best results" title="Questions with context get faster responses" />
            <div className="mt-5 space-y-3">
              {[
                'Describe the issue and where you saw it',
                'Share the page or workflow you were using',
                'Include screenshots if something looks broken',
              ].map((item) => (
                <div
                  key={item}
                  className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-white/10 bg-background/5 text-muted-foreground' : 'border-border bg-background/80 text-foreground'}`}
                >
                  {item}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

    </PublicPageContainer>
  );
}
