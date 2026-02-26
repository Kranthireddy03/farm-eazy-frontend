import React, { useState } from 'react';
import EmailService from '../services/EmailService';

function EmailTest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Form states
  const [testEmail, setTestEmail] = useState('');
  const [welcomeEmail, setWelcomeEmail] = useState('');
  const [welcomeName, setWelcomeName] = useState('');
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: '',
    body: '',
    html: false,
  });

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail) {
      showMessage('Please enter an email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await EmailService.sendTestEmail(testEmail);
      showMessage(response.message || 'Test email sent successfully!', 'success');
      setTestEmail('');
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to send test email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWelcomeEmail = async (e) => {
    e.preventDefault();
    if (!welcomeEmail || !welcomeName) {
      showMessage('Please enter email and name', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await EmailService.sendWelcomeEmail(welcomeEmail, welcomeName);
      showMessage(response.message || 'Welcome email sent successfully!', 'success');
      setWelcomeEmail('');
      setWelcomeName('');
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to send welcome email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCustomEmail = async (e) => {
    e.preventDefault();
    if (!customEmail.to || !customEmail.subject || !customEmail.body) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await EmailService.sendEmail(customEmail);
      showMessage(response.message || 'Email sent successfully!', 'success');
      setCustomEmail({ to: '', subject: '', body: '', html: false });
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">📧 Email Testing</h1>
        <p className="text-slate-400">Test email functionality for FarmEazy notifications</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            messageType === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Email */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">🧪</span>
            Test Email
          </h2>
          <form onSubmit={handleSendTestEmail}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="test@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </button>
          </form>
        </div>

        {/* Welcome Email */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">👋</span>
            Welcome Email
          </h2>
          <form onSubmit={handleSendWelcomeEmail}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={welcomeEmail}
                onChange={(e) => setWelcomeEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                User Name
              </label>
              <input
                type="text"
                value={welcomeName}
                onChange={(e) => setWelcomeName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Welcome Email'}
            </button>
          </form>
        </div>

        {/* Custom Email */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">✉️</span>
            Custom Email
          </h2>
          <form onSubmit={handleSendCustomEmail}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  To (Email Address)
                </label>
                <input
                  type="email"
                  value={customEmail.to}
                  onChange={(e) => setCustomEmail({ ...customEmail, to: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="recipient@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Email subject"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message Body
              </label>
              <textarea
                value={customEmail.body}
                onChange={(e) => setCustomEmail({ ...customEmail, body: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows="6"
                placeholder="Type your message here..."
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customEmail.html}
                  onChange={(e) => setCustomEmail({ ...customEmail, html: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-slate-600 bg-slate-700 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-slate-300">Send as HTML</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Custom Email'}
            </button>
          </form>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">📝 Email Configuration</h3>
        <div className="text-slate-300 space-y-2">
          <p>✅ Email service is enabled and configured</p>
          <p>📤 Emails are sent via Gmail SMTP (port 587)</p>
          <p>⏱️ Emails typically arrive within 5-10 seconds</p>
          <p>🔒 All emails require valid JWT authentication</p>
        </div>
      </div>
    </div>
  );
}

export default EmailTest;
