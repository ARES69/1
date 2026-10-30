import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, Zap, Shield, Globe, Code2, FileOutput,
  Play, Layers, Terminal, Monitor, ChevronDown, ChevronUp,
  Cpu, RefreshCw, Download, ExternalLink
} from 'lucide-react';
import { useI18n } from '../i18n';

/* ─── Hero ─── */
function Hero() {
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

  const scenarios = [
    'Landing page for a coffee shop',
    'Pitch deck for a SaaS startup',
    'Research report on AI trends',
    'Playable arcade game',
  ];

  return (
    <section className="relative pt-24 pb-16 bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium mb-6 bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
            <Zap size={12} />
            {t.hero.badge}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[var(--text)]">
            {t.hero.title}{' '}
            <span className="text-brand-600 dark:text-brand-400">{t.hero.titleHighlight}</span>
            {t.hero.titleEnd}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-8 text-[var(--text-secondary)]">
            {t.hero.subtitle}
          </p>

          {/* Composer */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
            <div className="relative flex items-center rounded-lg border bg-[var(--card)] transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10"
              style={{ borderColor: 'var(--border)' }}
            >
              <Sparkles size={16} className="absolute left-3 text-brand-600 dark:text-brand-400" />
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={t.hero.placeholder}
                className="flex-1 py-2.5 pl-9 pr-28 bg-transparent outline-none text-sm text-[var(--text)]"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 rounded bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors flex items-center gap-1.5"
              >
                {t.hero.cta}
                <ArrowRight size={12} />
              </button>
            </div>
          </form>

          {/* Scenario chips */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {scenarios.map(s => (
              <button
                key={s}
                onClick={() => { setPrompt(s); navigate('/app', { state: { initialPrompt: s } }); }}
                className="px-2.5 py-1 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/app"
              className="px-6 py-2 rounded bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Play size={14} />
              {t.hero.cta}
            </Link>
            <a
              href="#examples"
              className="px-6 py-2 rounded border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>
        </motion.div>

        {/* Live preview mock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 max-w-5xl mx-auto"
        >
          <div className="rounded-lg border overflow-hidden bg-[var(--card)]" style={{ borderColor: 'var(--border)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                  rs-builder.app/workspace
                </span>
              </div>
            </div>
            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 min-h-[280px]">
              {/* Thread panel */}
              <div className="p-3 border-r space-y-2 bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                  <Terminal size={11} /> Thread
                </div>
                <div className="space-y-1.5">
                  <div className="p-1.5 rounded text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    🧠 Planning...
                  </div>
                  <div className="p-1.5 rounded text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    🔧 write_file("index.html")
                  </div>
                  <div className="p-1.5 rounded text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                    ✅ Step 3/5
                  </div>
                </div>
              </div>
              {/* Preview panel */}
              <div className="col-span-2 p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium mb-2 text-[var(--text-muted)]">
                  <Monitor size={11} /> Preview
                </div>
                <div className="rounded border overflow-hidden h-44 flex items-center justify-center bg-[var(--bg-tertiary)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded bg-brand-600 flex items-center justify-center">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Live artifact preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function Features() {
  const { t } = useI18n();
  const icons = [Cpu, Globe, Monitor, Layers, Download, RefreshCw];

  return (
    <section className="py-16 bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-[var(--text)]">{t.features.title}</h2>
          <p className="text-base text-[var(--text-secondary)]">{t.features.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.features.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-brand-500/50 transition-all group"
              >
                <div className="w-9 h-9 rounded bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center mb-3 group-hover:bg-brand-100 dark:group-hover:bg-brand-950/30 transition-colors">
                  <Icon size={18} className="text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-base mb-1.5 text-[var(--text)]">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Process ─── */
function Process() {
  const { t } = useI18n();

  return (
    <section className="py-16 bg-[var(--bg)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-[var(--text)]">{t.process.title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {t.process.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-3">{step.num}</div>
              <h3 className="font-semibold text-base mb-1.5 text-[var(--text)]">{step.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{step.desc}</p>
              {i < 3 && (
                <div className="hidden md:block absolute top-6 -right-3 text-[var(--text-muted)]">
                  <ArrowRight size={16} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Examples ─── */
function Examples() {
  const { t } = useI18n();
  const colors = ['from-blue-500 to-purple-600', 'from-orange-500 to-pink-600', 'from-green-500 to-teal-600', 'from-purple-500 to-indigo-600'];

  return (
    <section id="examples" className="py-20" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>{t.examples.title}</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{t.examples.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.examples.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
            >
              <div className={`h-40 bg-gradient-to-br ${colors[i]} flex items-center justify-center`}>
                <Code2 size={40} className="text-white/80 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-4">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 bg-brand-500/10 text-brand-500">
                  {item.tag}
                </span>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Teaser ─── */
function PricingTeaser() {
  const { t } = useI18n();

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>{t.pricing.title}</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{t.pricing.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {t.pricing.plans.slice(0, 3).map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-2xl border transition-all ${plan.popular ? 'border-brand-500 shadow-lg shadow-brand-500/10 relative' : ''}`}
              style={{ borderColor: plan.popular ? undefined : 'var(--border)', backgroundColor: 'var(--card)' }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-xs font-medium">
                  Popular
                </div>
              )}
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text)' }}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{plan.price}</span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>
              <p className="text-sm font-medium text-brand-500 mb-4">{plan.credits}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 4).map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Shield size={14} className="text-accent-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  plan.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border hover:border-brand-500'
                }`}
                style={!plan.popular ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/pricing" className="text-brand-500 hover:text-brand-400 font-medium text-sm inline-flex items-center gap-1">
            View all plans <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FAQ() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12" style={{ color: 'var(--text)' }}>{t.faq.title}</h2>
        <div className="space-y-3">
          {t.faq.items.map((item, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-medium" style={{ color: 'var(--text)' }}>{item.q}</span>
                {open === i ? <ChevronUp size={18} className="text-brand-500 shrink-0" /> : <ChevronDown size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />}
              </button>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="px-4 pb-4"
                >
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.a}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  const { t } = useI18n();

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-12 rounded-3xl border relative overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%)' }} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 relative" style={{ color: 'var(--text)' }}>
            Ready to build?
          </h2>
          <p className="text-lg mb-8 relative" style={{ color: 'var(--text-secondary)' }}>
            Start creating real artifacts with AI. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
            <Link
              to="/app"
              className="px-8 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Sparkles size={18} />
              {t.hero.cta}
            </Link>
            <a
              href="https://github.com/ARES69/RS-BUILDER"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl border font-semibold transition-colors hover:border-brand-500 flex items-center gap-2"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <ExternalLink size={18} />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Home Page ─── */
export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Process />
      <Examples />
      <PricingTeaser />
      <FAQ />
      <CTA />
    </main>
  );
}
