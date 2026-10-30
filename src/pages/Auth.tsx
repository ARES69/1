import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-[400px]">
        {/* Terminal window */}
        <div className="rounded-[4px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-danger-red)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-warning-orange)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-success-green)' }} />
            </div>
            <span className="terminal-text text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
              ~/auth/{isLogin ? 'login' : 'signup'}
            </span>
          </div>
          
          {/* Form content */}
          <div className="p-6" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="terminal-text text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--color-success-green)' }}>$</span> {isLogin ? 'login' : 'signup'} --{isLogin ? 'existing' : 'new'}-user
            </div>

            <h1 className="terminal-text text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              {isLogin ? t.auth.loginTitle : t.auth.signupTitle}
            </h1>
            <p className="terminal-text text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? t.auth.loginSubtitle : t.auth.signupSubtitle}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-[4px] terminal-text text-sm" style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', border: '1px solid var(--color-danger-red)', color: 'var(--color-danger-red)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="terminal-text text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>
                    name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-terminal terminal-text text-sm w-full"
                    style={{ padding: '10px 12px' }}
                    placeholder="john doe"
                    required
                  />
                </div>
              )}

              <div>
                <label className="terminal-text text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>
                  email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-terminal terminal-text text-sm w-full"
                  style={{ padding: '10px 12px' }}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="terminal-text text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>
                  password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-terminal terminal-text text-sm w-full"
                  style={{ padding: '10px 12px' }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                {!isLogin && (
                  <p className="terminal-text text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    min 6 characters
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary terminal-text text-sm w-full"
                style={{ padding: '10px 20px' }}
              >
                {loading ? '...' : isLogin ? t.auth.loginBtn : t.auth.signupBtn}
              </button>
            </form>

            <div className="separator" />

            <p className="terminal-text text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="font-medium"
                style={{ color: 'var(--accent)' }}
              >
                {isLogin ? 'signup' : 'login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
