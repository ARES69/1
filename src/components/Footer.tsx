import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t mt-24" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="terminal-text text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              rs-builder
            </Link>
            <p className="terminal-text text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
              {t.footer.tagline}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="terminal-text text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>{t.footer.product}</h4>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="terminal-text text-sm" style={{ color: 'var(--text-muted)' }}>{t.nav.pricing}</Link></li>
              <li><Link to="/app" className="terminal-text text-sm" style={{ color: 'var(--text-muted)' }}>{t.nav.workspace}</Link></li>
              <li><Link to="/blog" className="terminal-text text-sm" style={{ color: 'var(--text-muted)' }}>{t.footer.blog}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="terminal-text text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>{t.footer.legal}</h4>
            <ul className="space-y-2">
              <li><Link to="/legal/terms" className="terminal-text text-sm" style={{ color: 'var(--text-muted)' }}>{t.footer.terms}</Link></li>
              <li><Link to="/legal/privacy" className="terminal-text text-sm" style={{ color: 'var(--text-muted)' }}>{t.footer.privacy}</Link></li>
              <li><Link to="/legal/about" className="terminal-text text-sm" style={{ color: 'var(--text-muted)' }}>{t.footer.about}</Link></li>
            </ul>
          </div>
        </div>

        <div className="separator" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="terminal-text text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} RS-BUILDER. {t.footer.rights}
          </p>
          <p className="terminal-text text-xs" style={{ color: 'var(--text-muted)' }}>
            built with ai
          </p>
        </div>
      </div>
    </footer>
  );
}
