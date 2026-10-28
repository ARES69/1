/**
 * DebugPanel — AI-powered debugging tools.
 * Error analysis, code inspection, and debugging utilities.
 */

import { useState } from 'react';
import { Bug, AlertTriangle, Code2, Database, Zap } from 'lucide-react';
import { analyzeError, analyzePerformance, analyzeSecurity, type ErrorAnalysis } from '../lib/ai-debugger';

interface DebugPanelProps {
  onAnalyzeError: (error: string, code?: string) => void;
}

export default function DebugPanel({ onAnalyzeError }: DebugPanelProps) {
  const [errorInput, setErrorInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [analysis, setAnalysis] = useState<ErrorAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'error' | 'performance' | 'security'>('error');

  const handleAnalyze = () => {
    if (!errorInput.trim()) return;
    const result = analyzeError(errorInput, codeInput);
    setAnalysis(result);
    onAnalyzeError(errorInput, codeInput);
  };

  const handlePerformanceCheck = () => {
    if (!codeInput.trim()) return;
    const issues = analyzePerformance(codeInput);
    // Display in thread
    onAnalyzeError(`Performance issues found: ${issues.length}`, codeInput);
  };

  const handleSecurityCheck = () => {
    if (!codeInput.trim()) return;
    const issues = analyzeSecurity(codeInput);
    onAnalyzeError(`Security issues found: ${issues.length}`, codeInput);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Bug className="text-red-500" />
          Debug Tools
        </h2>
        <p className="text-[var(--text-muted)]">
          AI-powered error analysis and code inspection
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('error')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <AlertTriangle size={16} className="inline mr-2" />
          Error Analysis
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'performance'
              ? 'bg-yellow-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <Zap size={16} className="inline mr-2" />
          Performance
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'security'
              ? 'bg-green-500 text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <Code2 size={16} className="inline mr-2" />
          Security
        </button>
      </div>

      {/* Error Analysis Tab */}
      {activeTab === 'error' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Error Message</label>
            <textarea
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
              placeholder="Paste error message or stack trace..."
              className="w-full h-32 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Related Code (optional)</label>
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste related code for better analysis..."
              className="w-full h-32 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!errorInput.trim()}
            className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Analyze Error
          </button>

          {analysis && (
            <div className="mt-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Analysis Results
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-[var(--text-muted)]">Error Type:</span>
                  <p className="text-sm">{analysis.errorType}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-[var(--text-muted)]">Severity:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    analysis.severity === 'error' ? 'bg-red-500/20 text-red-500' :
                    analysis.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {analysis.severity}
                  </span>
                </div>

                {analysis.file && (
                  <div>
                    <span className="text-sm font-medium text-[var(--text-muted)]">Location:</span>
                    <p className="text-sm font-mono">{analysis.file}:{analysis.line}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-[var(--text-muted)]">Suggestions:</span>
                  <ul className="mt-2 space-y-2">
                    {analysis.suggestions.map((suggestion, i) => (
                      <li key={i} className="p-3 bg-[var(--bg)] rounded border border-[var(--border)]">
                        <p className="text-sm font-medium mb-1">{suggestion.description}</p>
                        <p className="text-xs text-[var(--text-muted)] mb-2">{suggestion.explanation}</p>
                        {suggestion.code && (
                          <pre className="text-xs bg-[var(--bg-secondary)] p-2 rounded font-mono overflow-x-auto">
                            {suggestion.code}
                          </pre>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          suggestion.confidence === 'high' ? 'bg-green-500/20 text-green-500' :
                          suggestion.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {suggestion.confidence} confidence
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Code to Analyze</label>
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste code to check for performance issues..."
              className="w-full h-64 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handlePerformanceCheck}
            disabled={!codeInput.trim()}
            className="w-full py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Check Performance
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Code to Analyze</label>
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste code to check for security vulnerabilities..."
              className="w-full h-64 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleSecurityCheck}
            disabled={!codeInput.trim()}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Check Security
          </button>
        </div>
      )}
    </div>
  );
}
