import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RegistrationSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login after 2 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md text-center bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-8">
        <div className="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-green-400 mb-2">Registration Successful!</h2>
        <p className="text-slate-300 mb-4">Your account has been created. Redirecting to login...</p>
      </div>
    </div>
  );
}

export default RegistrationSuccess;
