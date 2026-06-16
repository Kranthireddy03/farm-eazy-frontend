import React, { useState } from 'react';
import axios from 'axios';

export default function ChangeContact({ type, onSuccess }) {
  const [step, setStep] = useState(1);
  const [oldOtp, setOldOtp] = useState('');
  const [newOtp, setNewOtp] = useState('');
  const [newValue, setNewValue] = useState('');
  const [message, setMessage] = useState('');

  const isEmail = type === 'email';

  const requestOld = async () => {
    try {
      const payload = isEmail ? { newEmail: newValue } : { newPhone: newValue };
      const res = await axios.post('/api/account/request-' + type + '-change', payload);
      setMessage(res.data || 'OTP sent to old contact');
      setStep(2);
    } catch (e) {
      setMessage(e.response?.data || 'Error');
    }
  };

  const verifyOld = async () => {
    try {
      const payload = isEmail ? { newEmail: newValue, oldOtp } : { newPhone: newValue, oldOtp };
      const res = await axios.post('/api/account/verify-' + type + '-change-old', payload);
      setMessage(res.data || 'Old verified');
      setStep(3);
    } catch (e) {
      setMessage(e.response?.data || 'Error');
    }
  };

  const requestNew = async () => {
    try {
      const payload = isEmail ? { newEmail: newValue } : { newPhone: newValue };
      const res = await axios.post('/api/account/request-' + type + '-change-new', payload);
      setMessage(res.data || 'OTP sent to new contact');
      setStep(4);
    } catch (e) {
      setMessage(e.response?.data || 'Error');
    }
  };

  const confirm = async () => {
    try {
      const payload = isEmail ? { newEmail: newValue, oldOtp, newOtp } : { newPhone: newValue, oldOtp, newOtp };
      const res = await axios.post('/api/account/confirm-' + type + '-change', payload);
      setMessage(res.data || 'Updated');
      onSuccess && onSuccess();
    } catch (e) {
      setMessage(e.response?.data || 'Error');
    }
  };

  return (
    <div className="p-4 rounded bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change {type}</h3>
      <div className="mt-3">
        <label className="block text-sm text-gray-700 dark:text-gray-200">New {type}</label>
        <input className="mt-1 block w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-gray-100" value={newValue} onChange={e => setNewValue(e.target.value)} />
      </div>

      {step >= 2 && (
        <div className="mt-3">
          <label className="block text-sm text-gray-700 dark:text-gray-200">Old OTP</label>
          <input className="mt-1 block w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-gray-100" value={oldOtp} onChange={e => setOldOtp(e.target.value)} />
        </div>
      )}

      {step >= 4 && (
        <div className="mt-3">
          <label className="block text-sm text-gray-700 dark:text-gray-200">New OTP</label>
          <input className="mt-1 block w-full p-2 border rounded bg-white dark:bg-gray-900 dark:text-gray-100" value={newOtp} onChange={e => setNewOtp(e.target.value)} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {step === 1 && <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={requestOld}>Send OTP to old</button>}
        {step === 2 && <button className="px-4 py-2 bg-yellow-600 text-white rounded" onClick={verifyOld}>Verify Old OTP</button>}
        {step === 3 && <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={requestNew}>Send OTP to new</button>}
        {step === 4 && <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={confirm}>Confirm Change</button>}
      </div>

      {message && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{message}</p>}
    </div>
  );
}
