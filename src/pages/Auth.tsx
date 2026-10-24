import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n';

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    // Demo mode: any credentials work
    navigate('/app');
  };

  const isLogin = mode === 'login';

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border p-8" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
              {isLogin ? t.auth.loginTitle : t.auth.signupTitle}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? t.auth.loginSubtitle : t.auth.signupSubtitle}
            </p>
          </div>

          {/* Demo notice */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 mb-6">
            <AlertCircle size={14} className="text-brand-500 shrink-0" />
            <p className="text-xs text-brand-500">{t.auth.demo}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {t.auth.name}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
            >
              {isLogin ? t.auth.loginBtn : t.auth.signupBtn}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? t.auth.noAccount : t.auth.hasAccount}{' '}
            <Link to={isLogin ? '/signup' : '/login'} className="text-brand-500 hover:text-brand-400 font-medium">
              {isLogin ? t.auth.signupBtn : t.auth.loginBtn}
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
