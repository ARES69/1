/**
 * Enhanced Collaboration — advanced real-time collaboration features.
 * Includes conflict resolution, version history, and presence awareness.
 */

import { CollaborativeSession, type CollaborativeUser, type CollaborativeEvent } from './collaborative';

export interface ConflictResolution {
  type: 'merge' | 'overwrite' | 'manual';
  baseContent: string;
  localContent: string;
  remoteContent: string;
  resolvedContent?: string;
}

export interface PresenceInfo {
  user: CollaborativeUser;
  file: string;
  selection?: { start: number; end: number };
  isTyping: boolean;
}

export interface CollaborationStats {
  totalUsers: number;
  activeUsers: number;
  filesBeingEdited: number;
  conflictsResolved: number;
  messagesExchanged: number;
}

/* ─── Enhanced Session Manager ─── */
export class EnhancedCollaborationManager {
  private session: CollaborativeSession;
  private presenceMap: Map<string, PresenceInfo> = new Map();
  private conflictHistory: ConflictResolution[] = [];
  private stats: CollaborationStats = {
    totalUsers: 0,
    activeUsers: 0,
    filesBeingEdited: 0,
    conflictsResolved: 0,
    messagesExchanged: 0,
  };
  private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();

  constructor(projectId: string, userName: string) {
    this.session = new CollaborativeSession(projectId, userName);
    this.setupEventHandlers();
  }

  /**
   * Join collaboration session with enhanced features
   */
  join(): void {
    this.session.join();
    this.stats.totalUsers++;
    this.stats.activeUsers++;
  }

  /**
   * Leave collaboration session
   */
  leave(): void {
    this.session.leave();
    this.stats.activeUsers--;
  }

  /**
   * Update presence with typing indicator
   */
  updatePresence(file: string, selection?: { start: number; end: number }, isTyping: boolean = false): void {
    const user = this.session.getCurrentUser();
    const presence: PresenceInfo = {
      user,
      file,
      selection,
      isTyping,
    };
    
    this.presenceMap.set(user.id, presence);
    this.session.updateCursor(file, selection?.start || 0, 0);
    
    this.triggerEvent('presence_update', presence);
  }

  /**
   * Get all active presences
   */
  getPresences(): PresenceInfo[] {
    return Array.from(this.presenceMap.values());
  }

  /**
   * Get users editing a specific file
   */
  getUsersEditingFile(filePath: string): CollaborativeUser[] {
    return this.getPresences()
      .filter(p => p.file === filePath)
      .map(p => p.user);
  }

  /**
   * Resolve conflict between local and remote changes
   */
  resolveConflict(conflict: ConflictResolution): string {
    let resolvedContent: string;

    switch (conflict.type) {
      case 'overwrite':
        resolvedContent = conflict.localContent;
        break;
      case 'merge':
        // Simple merge: combine both (in real app, use proper merge algorithm)
        resolvedContent = this.simpleMerge(conflict.baseContent, conflict.localContent, conflict.remoteContent);
        break;
      case 'manual':
        resolvedContent = conflict.resolvedContent || conflict.localContent;
        break;
      default:
        resolvedContent = conflict.localContent;
    }

    this.conflictHistory.push({ ...conflict, resolvedContent });
    this.stats.conflictsResolved++;
    
    this.triggerEvent('conflict_resolved', { conflict, resolvedContent });
    
    return resolvedContent;
  }

  /**
   * Get conflict resolution history
   */
  getConflictHistory(): ConflictResolution[] {
    return [...this.conflictHistory];
  }

  /**
   * Get collaboration statistics
   */
  getStats(): CollaborationStats {
    return { ...this.stats };
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Send chat message with stats tracking
   */
  sendChatMessage(message: string): void {
    this.session.sendChatMessage(message);
    this.stats.messagesExchanged++;
  }

  /* ─── Private Methods ─── */

  private setupEventHandlers(): void {
    this.session.on('user_join', (event) => {
      this.stats.totalUsers++;
      this.stats.activeUsers++;
      this.triggerEvent('user_joined', event.data.user);
    });

    this.session.on('user_leave', (event) => {
      this.stats.activeUsers--;
      this.presenceMap.delete(event.userId);
      this.triggerEvent('user_left', event.userId);
    });

    this.session.on('cursor_move', (event) => {
      const user = this.session.getUsers().find(u => u.id === event.userId);
      if (user) {
        const presence = this.presenceMap.get(event.userId);
        if (presence) {
          presence.user = user;
          this.presenceMap.set(event.userId, presence);
        }
      }
    });

    this.session.on('file_change', (event) => {
      const filesBeingEdited = new Set(
        this.getPresences().map(p => p.file)
      );
      this.stats.filesBeingEdited = filesBeingEdited.size;
      this.triggerEvent('file_changed', event.data);
    });
  }

  private simpleMerge(base: string, local: string, remote: string): string {
    // Simple line-by-line merge (in production, use proper diff3 algorithm)
    const baseLines = base.split('\n');
    const localLines = local.split('\n');
    const remoteLines = remote.split('\n');

    const result: string[] = [];
    const maxLen = Math.max(baseLines.length, localLines.length, remoteLines.length);

    for (let i = 0; i < maxLen; i++) {
      const baseLine = baseLines[i] || '';
      const localLine = localLines[i] || '';
      const remoteLine = remoteLines[i] || '';

      // If local changed, use local
      if (localLine !== baseLine) {
        result.push(localLine);
      }
      // If remote changed, use remote
      else if (remoteLine !== baseLine) {
        result.push(remoteLine);
      }
      // Otherwise use base
      else {
        result.push(baseLine);
      }
    }

    return result.join('\n');
  }

  private triggerEvent(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

/* ─── Utility Functions ─── */

/**
 * Format collaboration status for display
 */
export function formatCollaborationStatus(stats: CollaborationStats): string {
  const parts: string[] = [];
  
  if (stats.activeUsers > 0) {
    parts.push(`${stats.activeUsers} active user${stats.activeUsers > 1 ? 's' : ''}`);
  }
  
  if (stats.filesBeingEdited > 0) {
    parts.push(`${stats.filesBeingEdited} file${stats.filesBeingEdited > 1 ? 's' : ''} being edited`);
  }
  
  if (stats.conflictsResolved > 0) {
    parts.push(`${stats.conflictsResolved} conflict${stats.conflictsResolved > 1 ? 's' : ''} resolved`);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'No active collaboration';
}

/**
 * Check if there are potential conflicts
 */
export function detectPotentialConflicts(
  localContent: string,
  remoteContent: string
): boolean {
  // Simple heuristic: if both changed from base, potential conflict
  return localContent !== remoteContent;
}
