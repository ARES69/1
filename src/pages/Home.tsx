import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/app', { state: { initialPrompt: prompt } });
    } else {
      navigate('/app');
    }
  };

  return (
    <main>
      {/* Hero - Terminal style */}
      <section className="py-24 md:py-32">
        <div className="max-w-[900px] mx-auto px-6">
          {/* Terminal window */}
          <div className="rounded-[4px] overflow-hidden mb-12" style={{ border: '1px solid var(--border)' }}>
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-danger-red)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-warning-orange)' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--color-success-green)' }} />
              </div>
              <span className="terminal-text text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                ~/rs-builder
              </span>
            </div>
            
            {/* Terminal content */}
            <div className="p-6 md:p-8" style={{ backgroundColor: 'var(--bg)' }}>
              <div className="terminal-text text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--color-success-green)' }}>$</span> rs-builder --help
              </div>
              <div className="terminal-text text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <p>AI agent that delivers artifacts, not advice.</p>
                <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Usage:</p>
                <p>  rs-builder [prompt] [options]</p>
                <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Examples:</p>
                <p>  rs-builder "build a landing page"</p>
                <p>  rs-builder "create a pitch deck"</p>
                <p>  rs-builder "make a research report"</p>
              </div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="terminal-text text-3xl md:text-[38px] font-bold leading-[1.5] mb-6" style={{ color: 'var(--text)' }}>
            {t.hero.title}
          </h1>
          
          <p className="terminal-text text-base leading-[1.5] mb-8 max-w-[600px]" style={{ color: 'var(--text-secondary)' }}>
            {t.hero.subtitle}
          </p>

          {/* Prompt input */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={t.hero.placeholder}
                className="input-terminal flex-1 terminal-text text-sm"
                style={{ padding: '12px 16px' }}
              />
              <button type="submit" className="btn-primary terminal-text text-sm whitespace-nowrap">
                {t.hero.cta} →
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="flex flex-wrap gap-4">
            <Link to="/app" className="terminal-text text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              open workspace →
            </Link>
            <Link to="/pricing" className="terminal-text text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              view pricing →
            </Link>
            <a href="https://github.com/ARES69/RS-BUILDER" target="_blank" rel="noopener noreferrer" className="terminal-text text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              github →
            </a>
          </div>
        </div>
      </section>

      {/* Features - Terminal list style */}
      <section className="py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="terminal-text text-base font-bold mb-8" style={{ color: 'var(--text)' }}>
            # features
          </h2>
          
          <div className="space-y-6">
            {t.features.items.map((item, i) => (
              <div key={i} className="terminal-text">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-bold mt-0.5" style={{ color: 'var(--accent)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm leading-[1.5]" style={{ color: 'var(--text-secondary)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process - Terminal style */}
      <section className="py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="terminal-text text-base font-bold mb-8" style={{ color: 'var(--text)' }}>
            # how it works
          </h2>
          
          <div className="space-y-4">
            {t.process.steps.map((step, i) => (
              <div key={i} className="terminal-text text-sm">
                <span style={{ color: 'var(--color-success-green)' }}>$</span>{' '}
                <span style={{ color: 'var(--text)' }}>{step.title}</span>
                <span className="ml-2" style={{ color: 'var(--text-muted)' }}>— {step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <h2 className="terminal-text text-base font-bold mb-8" style={{ color: 'var(--text)' }}>
            # examples
          </h2>
          
          <div className="space-y-3">
            {t.examples.items.map((item, i) => (
              <div key={i} className="terminal-text text-sm p-4 rounded-[4px]" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="badge mr-2">{item.tag}</span>
                    <span className="font-bold" style={{ color: 'var(--text)' }}>{item.title}</span>
                    <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <h2 className="terminal-text text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            ready to build?
          </h2>
          <p className="terminal-text text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            start creating real artifacts with ai. no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/app" className="btn-primary terminal-text text-sm">
              {t.hero.cta} →
            </Link>
            <a
              href="https://github.com/ARES69/RS-BUILDER"
              target="_blank"
              rel="noopener noreferrer"
              className="terminal-text text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              view on github →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
