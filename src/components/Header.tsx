import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    // Re-check auth on navigation
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
    <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="gradient-text">RS-BUILDER</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'text-brand-500 bg-brand-500/10'
                    : 'hover:text-brand-400'
                }`}
                style={{ color: location.pathname === item.to ? undefined : 'var(--text-secondary)' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
              className="p-2 rounded-lg text-sm font-medium transition-colors hover:bg-brand-500/10"
              style={{ color: 'var(--text-secondary)' }}
              title={lang === 'en' ? 'Переключить на русский' : 'Switch to English'}
            >
              <Globe size={16} />
              <span className="ml-1 text-xs">{lang.toUpperCase()}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="p-2 rounded-lg transition-colors hover:bg-brand-500/10"
              style={{ color: 'var(--text-secondary)' }}
            >
              {themeIcon}
            </button>

            {/* Auth buttons / User menu */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <UserCircle size={16} className="text-brand-500" />
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500">{user.credits} credits</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
                    style={{ color: 'var(--text-muted)' }}
                    title="Log out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                  >
                    {t.nav.signup}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--text)' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
          >
            <nav className="px-4 py-4 space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
                {user ? (
                  <>
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <UserCircle size={16} className="text-brand-500" />
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.name}</span>
                    </div>
                    <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium text-red-500">
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--border)' }}>
                      {t.nav.login}
                    </Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white">
                      {t.nav.signup}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
