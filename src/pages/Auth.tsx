import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { signup, login } from '../lib/auth';

export default function Auth() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 300));

    if (isLogin) {
      const result = login(email, password);
      if (result.success) {
        navigate('/app');
      } else {
        setError(result.error || 'Login failed');
      }
    } else {
      const result = signup(email, password, name);
      if (result.success) {
        navigate('/app');
      } else {
        setError(result.error || 'Signup failed');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-14 bg-[var(--bg)]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-lg border p-6 bg-[var(--card)]" style={{ borderColor: 'var(--border)' }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded bg-brand-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold mb-1 text-[var(--text)]">
              {isLogin ? t.auth.loginTitle : t.auth.signupTitle}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {isLogin ? t.auth.loginSubtitle : t.auth.signupSubtitle}
            </p>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-2 p-3 rounded bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 mb-4">
            <CheckCircle size={14} className="text-brand-600 shrink-0 mt-0.5" />
            <p className="text-xs text-brand-700 dark:text-brand-400">
              {isLogin 
                ? 'Sign in to access your workspace' 
                : 'Create an account to get 50 free credits'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 p-3 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 mb-4"
            >
              <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="text-xs font-medium block mb-1 text-[var(--text-secondary)]">
                  {t.auth.name}
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded border text-sm bg-[var(--bg-secondary)] text-[var(--text)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                    style={{ borderColor: 'var(--border)' }}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="text-xs font-medium block mb-1 text-[var(--text-secondary)]">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded border text-sm bg-[var(--bg-secondary)] text-[var(--text)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1 text-[var(--text-secondary)]">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded border text-sm bg-[var(--bg-secondary)] text-[var(--text)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs mt-1 text-[var(--text-muted)]">
                  Minimum 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? t.auth.loginBtn : t.auth.signupBtn}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-xs mt-4 text-[var(--text-muted)]">
            {isLogin ? t.auth.noAccount : t.auth.hasAccount}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              {isLogin ? t.auth.signupBtn : t.auth.loginBtn}
            </button>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
