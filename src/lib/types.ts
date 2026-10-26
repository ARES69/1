/**
 * Shared types for the application.
 */

export interface ThreadMessage {
  id: string;
  type: 'user' | 'thinking' | 'tool_call' | 'console' | 'system' | 'error' | 'streaming';
  content: string;
  tool?: string;
  result?: string;
  timestamp: number;
  collapsed?: boolean;
}

export interface ImageAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  size: number;
}
