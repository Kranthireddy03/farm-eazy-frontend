import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export default function RedirectReset() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFullToken = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/r/${shortCode}`);
        const fullToken = response.data.token;
        
        // Redirect to reset password page with full token
        navigate(`/reset-password?token=${fullToken}`, { replace: true });
      } catch (error) {
        console.error('Failed to resolve reset link:', error);
        navigate('/login', { 
          replace: true,
          state: { error: 'Invalid or expired reset link' }
        });
      }
    };

    if (shortCode) {
      fetchFullToken();
    }
  }, [shortCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to password reset...</p>
      </div>
    </div>
  );
}
