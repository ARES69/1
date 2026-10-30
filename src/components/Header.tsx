import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useTheme } from '../lib/theme';
import { getCurrentUser, logout } from '../lib/auth';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const user = getCurrentUser();

  const navItems = [
    { to: '/', label: t.nav.home },
    { to: '/pricing', label: t.nav.pricing },
    { to: '/app', label: t.nav.workspace },
    { to: '/blog', label: t.nav.blog },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
      <div className="max-w-[900px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="terminal-text text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            rs-builder
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="terminal-text text-sm font-medium"
                style={{ 
                  color: location.pathname === item.to ? 'var(--text)' : 'var(--text-secondary)',
                  textDecoration: location.pathname === item.to ? 'underline' : 'none'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
              className="terminal-text text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {lang.toUpperCase()}
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="terminal-text text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {theme === 'dark' ? '◐' : theme === 'light' ? '○' : '◑'}
            </button>

            {/* Auth */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="terminal-text text-xs" style={{ color: 'var(--text-muted)' }}>
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="terminal-text text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/login"
                  className="terminal-text text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  login
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary terminal-text text-xs"
                >
                  signup
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden terminal-text text-sm"
              style={{ color: 'var(--text)' }}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <nav className="flex flex-col gap-3">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="terminal-text text-sm font-medium"
                  style={{ 
                    color: location.pathname === item.to ? 'var(--text)' : 'var(--text-secondary)',
                    textDecoration: location.pathname === item.to ? 'underline' : 'none'
                  }}
                >
                  {item.label}
                </Link>
              ))}
              {!user && (
                <>
                  <div className="separator" />
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="terminal-text text-sm font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary terminal-text text-sm text-center"
                  >
                    signup
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
