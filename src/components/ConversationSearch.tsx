/**
 * ConversationSearch — search through message history.
 */

import { useState, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { searchConversation, highlightMatch, type SearchResult } from '../lib/conversation-search';
import type { ThreadMessage } from '../lib/types';

interface ConversationSearchProps {
  messages: ThreadMessage[];
  onClose: () => void;
  onNavigateToMessage: (messageId: string) => void;
}

export default function ConversationSearch({ messages, onClose, onNavigateToMessage }: ConversationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchConversation(messages, query, caseSensitive);
      setResults(searchResults);
      setCurrentIndex(0);
    } else {
      setResults([]);
      setCurrentIndex(0);
    }
  }, [query, messages, caseSensitive]);

  const navigateToResult = (index: number) => {
    if (results.length === 0) return;
    const newIndex = (index + results.length) % results.length;
    setCurrentIndex(newIndex);
    onNavigateToMessage(results[newIndex].message.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        navigateToResult(currentIndex - 1);
      } else {
        navigateToResult(currentIndex + 1);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="absolute top-16 right-4 z-40 w-96 rounded-lg border shadow-lg p-3"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search conversation..."
          className="flex-1 px-2 py-1 rounded text-sm outline-none"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text)' }}
          autoFocus
        />
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`px-2 py-1 rounded text-xs font-mono ${caseSensitive ? 'bg-brand-500 text-white' : ''}`}
          style={!caseSensitive ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' } : {}}
          title="Case sensitive"
        >
          Aa
        </button>
        <button onClick={onClose} className="p-1 rounded hover:bg-brand-500/10" style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      {results.length > 0 && (
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{currentIndex + 1} of {results.length} matches</span>
          <div className="flex gap-1">
            <button
              onClick={() => navigateToResult(currentIndex - 1)}
              className="p-1 rounded hover:bg-brand-500/10"
              disabled={results.length === 0}
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => navigateToResult(currentIndex + 1)}
              className="p-1 rounded hover:bg-brand-500/10"
              disabled={results.length === 0}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      )}

      {query && results.length === 0 && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
          No matches found
        </p>
      )}
    </div>
  );
}
