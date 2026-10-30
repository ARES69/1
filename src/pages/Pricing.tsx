import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Pricing() {
  const { t } = useI18n();
  const [yearly, setYearly] = useState(false);

  return (
    <main className="py-24">
      <div className="max-w-[900px] mx-auto px-6">
        <h1 className="terminal-text text-3xl md:text-[38px] font-bold leading-[1.5] mb-4" style={{ color: 'var(--text)' }}>
          {t.pricing.title}
        </h1>
        <p className="terminal-text text-base mb-8" style={{ color: 'var(--text-secondary)' }}>
          {t.pricing.subtitle}
        </p>

        {/* Toggle */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => setYearly(false)}
            className="terminal-text text-sm font-medium"
            style={{ color: !yearly ? 'var(--text)' : 'var(--text-muted)' }}
          >
            {t.pricing.monthly}
          </button>
          <button
            onClick={() => setYearly(true)}
            className="terminal-text text-sm font-medium"
            style={{ color: yearly ? 'var(--text)' : 'var(--text-muted)' }}
          >
            {t.pricing.yearly}
          </button>
          {yearly && (
            <span className="badge" style={{ color: 'var(--color-success-green)' }}>
              {t.pricing.save}
            </span>
          )}
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {t.pricing.plans.map((plan, i) => {
            const price = yearly && plan.price !== '$0' && plan.price !== 'Custom'
              ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.8)}`
              : plan.price;

            return (
              <div key={i} className="card-terminal p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="terminal-text text-base font-bold mb-1" style={{ color: 'var(--text)' }}>
                      {plan.name}
                    </h3>
                    <div className="terminal-text text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{price}</span>
                      {plan.period && <span className="ml-1">{plan.period}</span>}
                    </div>
                  </div>
                  {plan.popular && (
                    <span className="badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                      popular
                    </span>
                  )}
                </div>

                <p className="terminal-text text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  {plan.credits}
                </p>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="terminal-text text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--color-success-green)' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className="btn-primary terminal-text text-sm inline-block"
                >
                  {plan.cta} →
                </Link>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="terminal-text text-base font-bold mb-8" style={{ color: 'var(--text)' }}>
            # faq
          </h2>
          <div className="space-y-6">
            {t.faq.items.map((item, i) => (
              <div key={i}>
                <h3 className="terminal-text text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>
                  {item.q}
                </h3>
                <p className="terminal-text text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
