/**
 * GitPanel — UI component for git operations and history visualization.
 */

import { useState } from 'react';
import { GitBranch, GitCommit, GitPullRequest, Clock, Plus, Minus, Edit, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { VirtualGit, GitCommit as GitCommitType } from '../lib/virtual-git';
import type { VirtualFS } from '../lib/virtual-fs';

interface GitPanelProps {
  git: VirtualGit;
  fs: VirtualFS;
  onCommit: (message: string) => void;
  onCheckout: (hash: string) => void;
  onBranchChange: (branch: string) => void;
}

export default function GitPanel({ git, fs, onCommit, onCheckout, onBranchChange }: GitPanelProps) {
  const [commitMessage, setCommitMessage] = useState('');
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [showBranches, setShowBranches] = useState(false);

  const status = git.getStatus(fs);
  const history = git.getHistory(20);
  const currentBranch = git.getCurrentBranch();
  const branches = git.listBranches();

  const hasChanges = status.modified.length > 0 || status.untracked.length > 0 || status.deleted.length > 0;

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    onCommit(commitMessage.trim());
    setCommitMessage('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-[var(--text)]">
            <GitBranch size={16} className="text-[var(--brand-500)]" />
            Git
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBranches(!showBranches)}
              className="px-2 py-1 text-xs rounded border border-[var(--border)] hover:border-[var(--brand-500)] transition-colors flex items-center gap-1 text-[var(--text-secondary)]"
            >
              <GitBranch size={12} />
              {currentBranch}
            </button>
          </div>
        </div>

        {/* Branch selector */}
        {showBranches && (
          <div className="mb-3 p-2 rounded border border-[var(--border)] bg-[var(--bg)]">
            <div className="text-xs font-medium mb-2 text-[var(--text-muted)]">Branches</div>
            {branches.map(branch => (
              <button
                key={branch}
                onClick={() => {
                  onBranchChange(branch);
                  setShowBranches(false);
                }}
                className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2 ${
                  branch === currentBranch
                    ? 'bg-[var(--brand-500)] text-white'
                    : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}
              >
                <GitBranch size={12} />
                {branch}
                {branch === currentBranch && <Check size={12} className="ml-auto" />}
              </button>
            ))}
          </div>
        )}

        {/* Commit input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="flex-1 px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--brand-500)] focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleCommit()}
          />
          <button
            onClick={handleCommit}
            disabled={!hasChanges && !commitMessage.trim()}
            className="px-3 py-2 text-sm rounded bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Commit
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="text-xs font-medium mb-2 text-[var(--text-muted)]">Changes</div>
        {hasChanges ? (
          <div className="space-y-1">
            {status.modified.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Edit size={12} className="text-yellow-500" />
                <span>{status.modified.length} modified</span>
              </div>
            )}
            {status.untracked.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Plus size={12} className="text-green-500" />
                <span>{status.untracked.length} untracked</span>
              </div>
            )}
            {status.deleted.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Minus size={12} className="text-red-500" />
                <span>{status.deleted.length} deleted</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted)] italic">No changes</div>
        )}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-medium mb-2 text-[var(--text-muted)]">History</div>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((commit) => (
              <div key={commit.hash} className="border border-[var(--border)] rounded bg-[var(--bg)]">
                <button
                  onClick={() => setExpandedCommit(expandedCommit === commit.hash ? null : commit.hash)}
                  className="w-full p-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text)] truncate">
                        {commit.message}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                        <span className="font-mono">{commit.hash.substring(0, 7)}</span>
                        <span>•</span>
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{formatDate(commit.timestamp)}</span>
                      </div>
                    </div>
                    {expandedCommit === commit.hash ? (
                      <ChevronDown size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                    )}
                  </div>
                </button>

                {expandedCommit === commit.hash && (
                  <div className="px-3 pb-3 border-t border-[var(--border)]">
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-[var(--text-muted)]">
                        {Object.keys(commit.files).length} files
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.keys(commit.files).slice(0, 5).map(file => (
                          <span
                            key={file}
                            className="px-2 py-0.5 text-xs rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-mono"
                          >
                            {file.split('/').pop()}
                          </span>
                        ))}
                        {Object.keys(commit.files).length > 5 && (
                          <span className="px-2 py-0.5 text-xs text-[var(--text-muted)]">
                            +{Object.keys(commit.files).length - 5} more
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onCheckout(commit.hash)}
                        className="mt-2 px-3 py-1 text-xs rounded border border-[var(--border)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)] transition-colors text-[var(--text-secondary)]"
                      >
                        Checkout this commit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--text-muted)] italic text-center py-8">
            No commits yet
          </div>
        )}
      </div>
    </div>
  );
}
