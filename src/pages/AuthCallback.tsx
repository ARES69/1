import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase-auth';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorDescription = urlParams.get('error_description');
        
        if (errorDescription) {
          setError(errorDescription);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Get session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (session) {
          // Successfully authenticated
          navigate('/workspace');
        } else {
          setError('No session found');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-md w-full p-8 bg-slate-800 rounded-lg border border-slate-700 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <p className="text-sm text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md w-full p-8 bg-slate-800 rounded-lg border border-slate-700 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
        <h2 className="text-xl font-bold text-white mb-2">Completing sign in...</h2>
        <p className="text-slate-400">Please wait while we verify your account</p>
      </div>
    </div>
  );
}
