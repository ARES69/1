/**
 * Conversation search — search through message history.
 */

import type { ThreadMessage } from './types';

export interface SearchResult {
  message: ThreadMessage;
  matchIndex: number;
  matchText: string;
  contextBefore: string;
  contextAfter: string;
}

export function searchConversation(
  messages: ThreadMessage[],
  query: string,
  caseSensitive: boolean = false
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = caseSensitive ? msg.content : msg.content.toLowerCase();
    
    let matchIndex = content.indexOf(searchQuery);
    while (matchIndex !== -1) {
      // Extract context (50 chars before and after)
      const start = Math.max(0, matchIndex - 50);
      const end = Math.min(msg.content.length, matchIndex + query.length + 50);
      
      results.push({
        message: msg,
        matchIndex,
        matchText: msg.content.substring(matchIndex, matchIndex + query.length),
        contextBefore: msg.content.substring(start, matchIndex),
        contextAfter: msg.content.substring(matchIndex + query.length, end),
      });

      // Find next match in same message
      matchIndex = content.indexOf(searchQuery, matchIndex + 1);
    }
  }

  return results;
}

export function highlightMatch(text: string, query: string, caseSensitive: boolean = false): string {
  if (!query.trim()) return text;
  
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapeRegex(query)})`, flags);
  return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">$1</mark>');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
