/**
 * First-run setup — guides user to get a real API key and test it.
 * No mocks, no simulations — real API calls from the start.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, Check, Loader2, Zap, AlertCircle } from 'lucide-react';
import { testProvider } from '../lib/llm-providers';
import { loadSettings, saveSettings, type ProviderKey } from '../lib/settings';

interface SetupModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function SetupModal({ onComplete, onSkip }: SetupModalProps) {
  const [step, setStep] = useState<'intro' | 'get-key' | 'test' | 'done'>('intro');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [settings, setSettings] = useState(loadSettings());

  const handleGetKey = () => {
    window.open('https://openrouter.ai/keys', '_blank');
    setStep('get-key');
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    
    setTesting(true);
    setTestResult(null);

    // Configure OpenRouter with the provided key
    const provider: ProviderKey = {
      id: 'openrouter',
      name: 'OpenRouter',
      apiKey: apiKey.trim(),
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      enabled: true,
    };

    const result = await testProvider(provider);
    setTestResult({ success: result.success, error: result.error });
    setTesting(false);

    if (result.success) {
      // Save settings
      const updated = {
        ...settings,
        providers: settings.providers.map((p: ProviderKey) => 
          p.id === 'openrouter' ? { ...p, apiKey: apiKey.trim(), enabled: true } : p
        ),
        activeProviderId: 'openrouter',
      };
      setSettings(updated);
      saveSettings(updated);
      setStep('done');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-2xl border p-8"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {step === 'intro' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Zap size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Welcome to RS-BUILDER
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Let's set up your AI agent in 30 seconds
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Get a free API key</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>OpenRouter gives you free access to 100+ models</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Paste your key</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Stored only in your browser, never sent to us</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Start building</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Real AI, real code, real artifacts</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGetKey}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
              >
                Get Free API Key <ExternalLink size={16} />
              </button>
              <button
                onClick={onSkip}
                className="px-6 py-3 rounded-xl border font-medium hover:border-brand-500 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {step === 'get-key' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Paste your API key
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Got your key from OpenRouter? Paste it below
              </p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text)' }}>
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-3 rounded-lg border text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/50"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
                autoFocus
              />
            </div>

            {testResult && !testResult.success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-500">{testResult.error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleTestKey}
                disabled={!apiKey.trim() || testing}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Testing...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Test & Save
                  </>
                )}
              </button>
              <button
                onClick={() => setStep('intro')}
                className="px-6 py-3 rounded-xl border font-medium hover:border-brand-500 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Back
              </button>
            </div>

            <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
              Didn't get a key?{' '}
              <button onClick={handleGetKey} className="text-brand-500 hover:text-brand-400 underline">
                Open OpenRouter again
              </button>
            </p>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                You're all set!
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your AI agent is ready to build real artifacts
              </p>
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <p className="text-sm font-medium text-emerald-500 mb-1">✓ Connected to OpenRouter</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Using: meta-llama/llama-3.3-70b-instruct:free
              </p>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
            >
              Start Building
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export function shouldShowSetup(): boolean {
  const settings = loadSettings();
  const openrouter = settings.providers.find((p: ProviderKey) => p.id === 'openrouter');
  return !openrouter?.apiKey;
}
