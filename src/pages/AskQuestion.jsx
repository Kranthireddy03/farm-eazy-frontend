import { useState } from 'react';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export default function AskQuestion() {
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
      setSubmitted(true);
      setResponse(res.data);
      setQuestion('');
      setEmail('');
      // If backend returns a special flag or message for FAQ addition, show congrats
      if (res.data && typeof res.data === 'object' && res.data.faqAdded) {
        setFaqCongrats(true);
        showToast('🎉 Your question was added to the FAQ! Thank you for contributing.', 'success');
      } else {
        setFaqCongrats(false);
        showToast('Your question was submitted and is being reviewed by admins. You will receive an answer soon.', 'info');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Failed to submit question.');
        showToast(err.response.data.message || 'Failed to submit question.', 'error');
      } else {
        setError('Network error. Please try again.');
        showToast('Network error. Please try again.', 'error');
      }
    }
  };

  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950">
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999 }}>
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}
      <div className="max-w-lg w-full p-8 rounded-2xl shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold mb-4">Ask a Question</h1>
        <p className="mb-4 text-gray-600 dark:text-slate-300">If your question is not answered in the FAQ, submit it below. Our admin team will reply via email. If your question is valuable, it may be added to the FAQ for others.</p>
        {submitted && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
            {faqCongrats ? (
              <>
                <div>🎉 Congratulations! Your question has been added to the FAQ. Thank you for contributing to FarmEazy!</div>
                <div className="mt-2">You can ask more questions anytime.</div>
              </>
            ) : (
              <>
                <div>{typeof response === 'string' ? response : 'Thank you for your question. Our admin team will reply via email.'}</div>
                <div className="mt-2">You can ask more questions anytime. If your question is valuable, it may be added to the FAQ and you'll be congratulated!</div>
              </>
            )}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="Your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <textarea
            className="w-full px-4 py-2 rounded-lg resize-none bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="Type your question here..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={5}
            required
          />
          <button type="submit" className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">Submit Question</button>
        </form>
        <div className="mt-6 text-sm text-gray-500 dark:text-slate-400">
          If you need further help, <button className="text-blue-600 dark:text-blue-400 underline" onClick={() => navigate('/support/ticket')}>raise a support ticket</button>.
        </div>
      </div>
    </div>
  );
}
