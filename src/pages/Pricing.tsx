import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Users, Building2 } from 'lucide-react';
import { useI18n } from '../i18n';

export default function Pricing() {
  const { t } = useI18n();
  const [yearly, setYearly] = useState(false);

  return (
    <main className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--text)' }}>{t.pricing.title}</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>{t.pricing.subtitle}</p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!yearly ? '' : ''}`} style={{ color: !yearly ? 'var(--text)' : 'var(--text-muted)' }}>
              {t.pricing.monthly}
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className="relative w-12 h-6 rounded-full transition-colors bg-brand-600"
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${yearly ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1`} style={{ color: yearly ? 'var(--text)' : 'var(--text-muted)' }}>
              {t.pricing.yearly}
              <span className="px-1.5 py-0.5 rounded text-xs bg-accent-500/10 text-accent-500 font-medium">
                {t.pricing.save}
              </span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {t.pricing.plans.map((plan, i) => {
            const price = yearly && plan.price !== '$0' && plan.price !== 'Custom'
              ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.8)}`
              : plan.price;
            const period = yearly && plan.price !== '$0' && plan.price !== 'Custom' ? '/мес (годовая)' : plan.period;
            const icons = [Zap, Shield, Users, Building2];
            const Icon = icons[i];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all hover:shadow-xl ${
                  plan.popular
                    ? 'border-brand-500 shadow-lg shadow-brand-500/10 scale-105'
                    : 'hover:border-brand-500/50'
                }`}
                style={{ borderColor: plan.popular ? undefined : 'var(--border)', backgroundColor: 'var(--card)' }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-xs font-medium">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.popular ? 'bg-brand-500' : 'bg-brand-500/10'}`}>
                    <Icon size={16} className={plan.popular ? 'text-white' : 'text-brand-500'} />
                  </div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>{price}</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{period}</span>
                </div>
                <p className="text-sm font-medium text-brand-500 mb-6">{plan.credits}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Check size={16} className="text-accent-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    plan.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border hover:border-brand-500 hover:text-brand-500'
                  }`}
                  style={!plan.popular ? { borderColor: 'var(--border)', color: 'var(--text-secondary)' } : {}}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
          <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Detailed Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left p-4 font-medium" style={{ color: 'var(--text-muted)' }}>Feature</th>
                  <th className="text-center p-4 font-medium" style={{ color: 'var(--text-muted)' }}>Free</th>
                  <th className="text-center p-4 font-medium text-brand-500">Pro</th>
                  <th className="text-center p-4 font-medium" style={{ color: 'var(--text-muted)' }}>Team</th>
                  <th className="text-center p-4 font-medium" style={{ color: 'var(--text-muted)' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['AI Credits/month', '50', '500', '2,000', 'Unlimited'],
                  ['Models', 'Basic', 'All + Priority', 'All + Priority', 'Custom'],
                  ['Concurrent runs', '1', '3', '10', 'Unlimited'],
                  ['Artifact hosting', 'Public', 'Private', 'Shared', 'Private'],
                  ['API access', '—', '✓', '✓', '✓'],
                  ['Custom domain', '—', '✓', '✓', '✓'],
                  ['SSO', '—', '—', '✓', '✓'],
                  ['SLA', '—', '—', '—', '✓'],
                  ['Support', 'Community', 'Priority', 'Priority', 'Dedicated'],
                ].map(([feature, ...values], i) => (
                  <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--text)' }}>{feature}</td>
                    {values.map((v, j) => (
                      <td key={j} className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>
                        {v === '✓' ? <Check size={16} className="inline text-accent-500" /> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
