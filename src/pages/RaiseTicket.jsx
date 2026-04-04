import React, { useState } from 'react';
import apiClient from '../services/apiClient';

export default function RaiseTicket() {
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
      await apiClient.post('/support-tickets/guest', {
        subject,
        description,
        contactEmail: email,
      });
      setSubmitted(true);
      setSubject('');
      setDescription('');
      setEmail('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit ticket.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-lg w-full p-8 rounded-2xl shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold mb-4">Raise a Support Ticket</h1>
        <p className="mb-4 text-gray-600 dark:text-slate-300">Describe your issue or question. Our support team will contact you via email.</p>
        {submitted && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Your ticket has been submitted successfully!</div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
          <textarea
            className="w-full px-4 py-2 rounded-lg resize-none bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="Describe your issue..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            required
          />
          <input
            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            placeholder="Your Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">Submit Ticket</button>
        </form>
      </div>
    </div>
  );
}
