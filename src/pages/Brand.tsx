import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Copy, Check, Download, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';

const colors = [
  { name: 'Brand 500', hex: '#6366f1', css: '--color-brand-500' },
  { name: 'Brand 600', hex: '#4f46e5', css: '--color-brand-600' },
  { name: 'Brand 700', hex: '#4338ca', css: '--color-brand-700' },
  { name: 'Accent 500', hex: '#10b981', css: '--color-accent-500' },
  { name: 'Surface 900', hex: '#0f172a', css: '--color-surface-900' },
  { name: 'Surface 50', hex: '#f8fafc', css: '--color-surface-50' },
];

const fonts = [
  { name: 'Inter', usage: 'Body text, headings, UI', weight: '400, 500, 600, 700, 800' },
  { name: 'JetBrains Mono', usage: 'Code, technical content', weight: '400, 500, 600' },
];

export default function Brand() {
  const { t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>Brand Kit</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Colors, typography, and assets for RS-BUILDER
          </p>
        </div>

        {/* Logo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 rounded-2xl border text-center"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        >
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text)' }}>Logo</h2>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {/* Dark bg */}
            <div className="p-8 rounded-xl bg-surface-900 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <span className="text-2xl font-bold text-white">RS-BUILDER</span>
              </div>
            </div>
            {/* Light bg */}
            <div className="p-8 rounded-xl bg-white border flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <span className="text-2xl font-bold text-surface-900">RS-BUILDER</span>
              </div>
            </div>
          </div>
          <button className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors hover:border-brand-500"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Download size={14} /> Download SVG
          </button>
        </motion.section>

        {/* Colors */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-8 rounded-2xl border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Palette size={20} className="text-brand-500" />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Color Palette</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {colors.map(color => (
              <div key={color.name} className="group">
                <div
                  className="w-full h-20 rounded-xl mb-2 cursor-pointer transition-transform group-hover:scale-105"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleCopy(color.hex, color.name)}
                />
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{color.name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{color.hex}</p>
                  {copied === color.name && <Check size={10} className="text-accent-500" />}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Typography */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 p-8 rounded-2xl border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Type size={20} className="text-brand-500" />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Typography</h2>
          </div>
          <div className="space-y-6">
            {fonts.map(font => (
              <div key={font.name} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{font.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">{font.weight}</span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{font.usage}</p>
                <p className={`text-3xl font-bold ${font.name === 'JetBrains Mono' ? 'font-mono' : ''}`} style={{ color: 'var(--text)' }}>
                  The quick brown fox
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Do's and Don'ts */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 rounded-2xl border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
        >
          <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text)' }}>Usage Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-accent-500 mb-3">✓ Do</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>• Use the logo on dark or light backgrounds</li>
                <li>• Maintain clear space around the logo</li>
                <li>• Use brand colors consistently</li>
                <li>• Keep the gradient direction (135°)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-500 mb-3">✗ Don't</h3>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>• Stretch or distort the logo</li>
                <li>• Change the gradient colors</li>
                <li>• Place on busy backgrounds</li>
                <li>• Use without sufficient contrast</li>
              </ul>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
