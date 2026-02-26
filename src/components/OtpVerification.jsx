/**
 * OTP Verification Modal Component - Modern FarmEazy Design
 * Features elegant glass morphism design with animated elements
 */

import { useState, useRef, useEffect } from 'react';
import AuthService from '../services/AuthService';

function OtpVerification({ 
  isOpen, 
  onClose, 
  email, 
  phone, 
  purpose, 
  onVerified,
  onResend 
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 100);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await AuthService.verifyOtp(email, otpCode, purpose);
      if (response.verified) {
        setSuccess('OTP verified successfully!');
        setTimeout(() => onVerified(), 500);
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setLoading(true);
    setError('');

    try {
      await AuthService.requestOtp(email, phone, purpose);
      setSuccess('OTP resent successfully! Check your email.');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md transform transition-all animate-[slideUp_0.3s_ease-out]">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce" style={{animationDuration: '2s'}}>
              <span className="text-4xl">📧</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
            <p className="text-emerald-100 mt-2 text-sm">
              We've sent a 6-digit code to
            </p>
            <p className="text-white font-semibold">{email}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* OTP Input */}
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all ${
                    error 
                      ? 'border-red-400 bg-red-500/10' 
                      : digit 
                        ? 'border-emerald-400 bg-emerald-500/10' 
                        : 'border-white/20 hover:border-white/40'
                  }`}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 animate-shake">
                <span>❌</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                <span>✅</span>
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading || otp.join('').length !== 6}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all transform flex items-center justify-center gap-2 ${
                loading || otp.join('').length !== 6
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30 hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <span>✓</span> Verify OTP
                </>
              )}
            </button>

            {/* Resend Section */}
            <div className="text-center mt-6 pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                Didn't receive the code?{' '}
                {resendCountdown > 0 ? (
                  <span className="text-gray-500">
                    Resend in <span className="text-emerald-400 font-bold">{resendCountdown}s</span>
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline disabled:text-gray-500"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full mt-4 py-3 text-gray-400 hover:text-white font-medium transition-colors rounded-xl hover:bg-white/5"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default OtpVerification;
