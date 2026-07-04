import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { GraduationCap, Mail, Lock, AlertCircle } from 'lucide-react';

const GOOGLE_CLIENT_ID = '936476255415-6lglsb7amgin8bk7h66g0u29vjmh24vv.apps.googleusercontent.com';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { googleLogin, login } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const googleInitialized = useRef(false);

  const navigateByRole = useCallback((user) => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    if (googleInitialized.current) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current && !googleInitialized.current) {
        googleInitialized.current = true;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            setErrorMsg('');
            try {
              const loggedUser = await googleLogin(response.credential);
              navigateByRole(loggedUser);
            } catch (err) {
              setErrorMsg(err.message || 'Google sign-in failed.');
            }
          },
        });

        // Render the official Google button inside our container
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: googleBtnRef.current.offsetWidth || 400,
        });
      }
    };

    // Try immediately
    initGoogle();

    // Retry after script loads (only if not yet initialized)
    const timer = setTimeout(initGoogle, 1500);
    return () => clearTimeout(timer);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const loggedUser = await login(email, password);
      navigateByRole(loggedUser);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-grid-pattern py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-primary-500/10 blur-[90px] dark:bg-primary-500/5 pulse-glow" />

      <Card className="w-full max-w-md p-8 border border-slate-100 dark:border-slate-800/40 relative shadow-lg">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md shadow-primary-500/20 mb-3 bg-white dark:bg-slate-800">
            <img src="/favicon.svg.png" alt="Navta Logo" className="h-8 w-8 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Log in to resume your learning streaks</p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 mb-6">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign-In Button — rendered by Google Identity Services */}
        <div
          ref={googleBtnRef}
          id="google-signin-btn"
          className="w-full flex items-center justify-center [&>div]:!w-full"
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200/70 dark:bg-slate-700/50" />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-200/70 dark:bg-slate-700/50" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder-slate-400/60 focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <Link to="#" className="text-xs font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder-slate-400/60 focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3 mt-4">
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
            Sign up here
          </Link>
        </p>
      </Card>
    </div>
  );
}
