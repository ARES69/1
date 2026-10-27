/**
 * DeployPanel — UI component for one-click deployment.
 */

import { useState } from 'react';
import { Rocket, ExternalLink, Download, Check, X, Loader2 } from 'lucide-react';
import { deploy, downloadDeployPackage, type DeployProvider, type DeployStatus, type DeployResult } from '../lib/deploy';
import type { VirtualFS } from '../lib/virtual-fs';

interface DeployPanelProps {
  fs: VirtualFS | null;
  projectName: string;
  onDeploy?: (result: DeployResult) => void;
}

export default function DeployPanel({ fs, projectName, onDeploy }: DeployPanelProps) {
  const [provider, setProvider] = useState<DeployProvider>('vercel');
  const [customDomain, setCustomDomain] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [status, setStatus] = useState<DeployStatus | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);

  const handleDeploy = async () => {
    if (!fs) return;

    setDeploying(true);
    setResult(null);

    const deployResult = await deploy(
      {
        provider,
        projectName,
        customDomain: customDomain || undefined,
      },
      fs,
      (s) => setStatus(s)
    );

    setResult(deployResult);
    setDeploying(false);
    onDeploy?.(deployResult);
  };

  const handleDownload = () => {
    if (!fs) return;
    downloadDeployPackage(fs, projectName);
  };

  const reset = () => {
    setStatus(null);
    setResult(null);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Rocket className="text-[var(--brand-500)]" />
          Deploy to Production
        </h2>
        <p className="text-[var(--text-muted)]">
          Publish your project to the web with one click
        </p>
      </div>

      {/* Provider Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Select Provider</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setProvider('vercel')}
            disabled={deploying}
            className={`p-4 rounded-lg border-2 transition-all ${
              provider === 'vercel'
                ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/10'
                : 'border-[var(--border)] hover:border-[var(--brand-500)]/50'
            }`}
          >
            <div className="text-2xl mb-2">▲</div>
            <div className="font-medium">Vercel</div>
            <div className="text-xs text-[var(--text-muted)]">Fast & Global</div>
          </button>

          <button
            onClick={() => setProvider('netlify')}
            disabled={deploying}
            className={`p-4 rounded-lg border-2 transition-all ${
              provider === 'netlify'
                ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/10'
                : 'border-[var(--border)] hover:border-[var(--brand-500)]/50'
            }`}
          >
            <div className="text-2xl mb-2">◆</div>
            <div className="font-medium">Netlify</div>
            <div className="text-xs text-[var(--text-muted)]">Easy & Reliable</div>
          </button>

          <button
            onClick={() => setProvider('github-pages')}
            disabled={deploying}
            className={`p-4 rounded-lg border-2 transition-all ${
              provider === 'github-pages'
                ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/10'
                : 'border-[var(--border)] hover:border-[var(--brand-500)]/50'
            }`}
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-medium">GitHub Pages</div>
            <div className="text-xs text-[var(--text-muted)]">Free & Simple</div>
          </button>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Custom Domain <span className="text-[var(--text-muted)]">(optional)</span>
        </label>
        <input
          type="text"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="myapp.com"
          disabled={deploying}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] focus:border-[var(--brand-500)] focus:outline-none transition-colors"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Leave empty for auto-generated subdomain
        </p>
      </div>

      {/* Deploy Button */}
      <div className="mb-6">
        <button
          onClick={handleDeploy}
          disabled={!fs || deploying}
          className="w-full py-3 rounded-lg bg-[var(--brand-500)] text-white font-medium hover:bg-[var(--brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {deploying ? (
            <>
              <Loader2 className="animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket />
              Deploy Now
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{status.message}</span>
            <span className="text-sm text-[var(--text-muted)]">{status.progress}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand-500)] transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          result.success 
            ? 'border-green-500 bg-green-500/10' 
            : 'border-red-500 bg-red-500/10'
        }`}>
          {result.success ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Check className="text-green-500" />
                <span className="font-medium text-green-500">Deployment Successful!</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">URL:</span>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--brand-500)] hover:underline flex items-center gap-1"
                  >
                    {result.url}
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Provider:</span>
                  <span className="text-sm">{result.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Deployed:</span>
                  <span className="text-sm">{new Date(result.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <X className="text-red-500" />
                <span className="font-medium text-red-500">Deployment Failed</span>
              </div>
              <p className="text-sm text-red-400">{result.error}</p>
            </>
          )}
          <button
            onClick={reset}
            className="mt-3 text-sm text-[var(--brand-500)] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Download Package */}
      <div className="mt-auto pt-6 border-t border-[var(--border)]">
        <button
          onClick={handleDownload}
          disabled={!fs}
          className="w-full py-2 rounded-lg border border-[var(--border)] hover:border-[var(--brand-500)] hover:bg-[var(--brand-500)]/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download />
          Download Package
        </button>
        <p className="text-xs text-[var(--text-muted)] text-center mt-2">
          Download deployment package for manual deployment
        </p>
      </div>
    </div>
  );
}
