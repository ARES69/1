/**
 * Collaborative Editing — real-time collaboration using BroadcastChannel API.
 * Enables multiple users to edit the same project simultaneously.
 */

export interface CollaborativeUser {
  id: string;
  name: string;
  color: string;
  cursor?: { file: string; line: number; column: number };
  lastActive: number;
}

export interface CollaborativeEvent {
  type: 'user_join' | 'user_leave' | 'cursor_move' | 'file_change' | 'chat_message';
  userId: string;
  userName: string;
  timestamp: number;
  data: any;
}

export interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

const COLLAB_CHANNEL = 'rs-builder-collab';
const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
];

/* ─── Collaborative Session ─── */
export class CollaborativeSession {
  private channel: BroadcastChannel | null = null;
  private projectId: string;
  private user: CollaborativeUser;
  private users: Map<string, CollaborativeUser> = new Map();
  private eventHandlers: Map<string, Array<(event: CollaborativeEvent) => void>> = new Map();
  private cleanupInterval: number | null = null;

  constructor(projectId: string, userName: string) {
    this.projectId = projectId;
    this.user = {
      id: this.generateUserId(),
      name: userName,
      color: this.getRandomColor(),
      lastActive: Date.now(),
    };
  }

  /**
   * Join collaborative session
   */
  join(): void {
    try {
      this.channel = new BroadcastChannel(`${COLLAB_CHANNEL}-${this.projectId}`);
      this.channel.onmessage = (event) => this.handleMessage(event.data);
      
      // Announce join
      this.broadcast({
        type: 'user_join',
        userId: this.user.id,
        userName: this.user.name,
        timestamp: Date.now(),
        data: { user: this.user },
      });

      // Add self to users
      this.users.set(this.user.id, this.user);

      // Cleanup inactive users every 30 seconds
      this.cleanupInterval = window.setInterval(() => {
        this.cleanupInactiveUsers();
      }, 30000);
    } catch (e) {
      console.error('Failed to join collaborative session:', e);
    }
  }

  /**
   * Leave collaborative session
   */
  leave(): void {
    if (this.channel) {
      this.broadcast({
        type: 'user_leave',
        userId: this.user.id,
        userName: this.user.name,
        timestamp: Date.now(),
        data: {},
      });
      this.channel.close();
      this.channel = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.users.clear();
  }

  /**
   * Broadcast cursor position
   */
  updateCursor(file: string, line: number, column: number): void {
    this.user.cursor = { file, line, column };
    this.user.lastActive = Date.now();
    
    this.broadcast({
      type: 'cursor_move',
      userId: this.user.id,
      userName: this.user.name,
      timestamp: Date.now(),
      data: { cursor: this.user.cursor },
    });
  }

  /**
   * Broadcast file change
   */
  notifyFileChange(filePath: string, content: string): void {
    this.broadcast({
      type: 'file_change',
      userId: this.user.id,
      userName: this.user.name,
      timestamp: Date.now(),
      data: { file: filePath, content },
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string): void {
    this.broadcast({
      type: 'chat_message',
      userId: this.user.id,
      userName: this.user.name,
      timestamp: Date.now(),
      data: { message },
    });
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (event: CollaborativeEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Get active users
   */
  getUsers(): CollaborativeUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Get current user
   */
  getCurrentUser(): CollaborativeUser {
    return this.user;
  }

  /* ─── Private Methods ─── */

  private broadcast(event: CollaborativeEvent): void {
    if (this.channel) {
      this.channel.postMessage(event);
    }
  }

  private handleMessage(event: CollaborativeEvent): void {
    // Ignore own messages
    if (event.userId === this.user.id) return;

    switch (event.type) {
      case 'user_join':
        this.users.set(event.userId, event.data.user);
        this.triggerEvent('user_join', event);
        break;

      case 'user_leave':
        this.users.delete(event.userId);
        this.triggerEvent('user_leave', event);
        break;

      case 'cursor_move':
        const user = this.users.get(event.userId);
        if (user) {
          user.cursor = event.data.cursor;
          user.lastActive = Date.now();
          this.triggerEvent('cursor_move', event);
        }
        break;

      case 'file_change':
        this.triggerEvent('file_change', event);
        break;

      case 'chat_message':
        this.triggerEvent('chat_message', event);
        break;
    }
  }

  private triggerEvent(eventType: string, event: CollaborativeEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  private cleanupInactiveUsers(): void {
    const now = Date.now();
    const timeout = 60000; // 1 minute

    for (const [userId, user] of this.users.entries()) {
      if (userId !== this.user.id && now - user.lastActive > timeout) {
        this.users.delete(userId);
        this.triggerEvent('user_leave', {
          type: 'user_leave',
          userId,
          userName: user.name,
          timestamp: now,
          data: {},
        });
      }
    }
  }

  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomColor(): string {
    return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  }
}

/* ─── Presence Indicator Component Helper ─── */
export function formatUserPresence(users: CollaborativeUser[]): string {
  if (users.length === 0) return 'No other users';
  if (users.length === 1) return `${users[0].name} is editing`;
  if (users.length === 2) return `${users[0].name} and ${users[1].name} are editing`;
  return `${users[0].name} and ${users.length - 1} others are editing`;
}

export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
