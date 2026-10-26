/**
 * ContextWindowIndicator — visual indicator of context window usage.
 */

import { AlertTriangle } from 'lucide-react';
import type { ContextWindow } from '../lib/context-window';

interface ContextWindowIndicatorProps {
  context: ContextWindow;
  onCompact?: () => void;
}

export default function ContextWindowIndicator({ context, onCompact }: ContextWindowIndicatorProps) {
  const getColor = () => {
    if (context.status === 'critical') return 'bg-red-500';
    if (context.status === 'warning') return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getTextColor = () => {
    if (context.status === 'critical') return 'text-red-500';
    if (context.status === 'warning') return 'text-yellow-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${Math.min(context.percentage, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-mono ${getTextColor()}`}>
        {context.percentage.toFixed(0)}%
      </span>
      {context.status === 'critical' && onCompact && (
        <button
          onClick={onCompact}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors"
          title="Compact conversation to free up context"
        >
          <AlertTriangle size={12} />
          Compact
        </button>
      )}
    </div>
  );
}
