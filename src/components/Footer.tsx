import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter } from 'lucide-react';
import { useI18n } from '../i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold text-base mb-3">
              <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="text-[var(--text)]">RS-BUILDER</span>
            </Link>
            <p className="text-sm max-w-xs text-[var(--text-secondary)]">
              {t.footer.tagline}
            </p>
            <div className="flex gap-2 mt-4">
              <a href="https://github.com/ARES69/RS-BUILDER" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Github size={16} />
              </a>
              <a href="#" className="p-2 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-[var(--text)]">{t.footer.product}</h4>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.nav.pricing}</Link></li>
              <li><Link to="/app" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.nav.workspace}</Link></li>
              <li><Link to="/blog" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.footer.blog}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-[var(--text)]">{t.footer.resources}</h4>
            <ul className="space-y-2">
              <li><a href="https://github.com/ARES69/RS-BUILDER" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.footer.docs}</a></li>
              <li><Link to="/legal/changelog" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.footer.changelog}</Link></li>
              <li><Link to="/legal/security" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.footer.security}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-[var(--text)]">{t.footer.legal}</h4>
            <ul className="space-y-2">
              <li><Link to="/legal/terms" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.footer.terms}</Link></li>
              <li><Link to="/legal/privacy" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.footer.privacy}</Link></li>
              <li><Link to="/legal/about" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{t.footer.about}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} RS-BUILDER. {t.footer.rights}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Built with ❤️ and AI
          </p>
        </div>
      </div>
    </footer>
  );
}
