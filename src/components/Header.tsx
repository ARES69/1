import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, Moon, Sun, Monitor, Globe, LogOut, UserCircle } from 'lucide-react';
import { useI18n } from '../i18n';
import { useTheme } from '../lib/theme';
import { getCurrentUser, logout, type User } from '../lib/auth';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const navItems = [
    { to: '/', label: t.nav.home },
    { to: '/pricing', label: t.nav.pricing },
    { to: '/app', label: t.nav.workspace },
    { to: '/blog', label: t.nav.blog },
  ];

  const themeIcon = theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-[var(--bg)]" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold text-base">
            <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="text-[var(--text)]">RS-BUILDER</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
              className="p-2 rounded text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
              title={lang === 'en' ? 'Переключить на русский' : 'Switch to English'}
            >
              <Globe size={16} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {themeIcon}
            </button>

            {/* Auth buttons / User menu */}
            <div className="hidden md:flex items-center gap-1 ml-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-secondary)]">
                    <UserCircle size={16} className="text-brand-600" />
                    <span className="text-sm font-medium text-[var(--text)]">{user.name}</span>
                    <span className="text-xs font-medium text-brand-600">{user.credits}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Log out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-1.5 rounded text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                  >
                    {t.nav.signup}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded text-[var(--text)]"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-[var(--bg)]" style={{ borderColor: 'var(--border)' }}>
          <nav className="px-4 py-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
              {user ? (
                <>
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded bg-[var(--bg-secondary)]">
                    <UserCircle size={16} className="text-brand-600" />
                    <span className="text-sm font-medium text-[var(--text)]">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="px-4 py-2 rounded text-sm font-medium text-red-500">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 px-4 py-2 rounded text-sm font-medium border text-center" style={{ borderColor: 'var(--border)' }}>
                    {t.nav.login}
                  </Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1 px-4 py-2 rounded text-sm font-medium bg-brand-600 text-white text-center">
                    {t.nav.signup}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
