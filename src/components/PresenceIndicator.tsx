/**
 * Presence Indicator Component — shows who is editing what in real-time.
 */

import { useState, useEffect } from 'react';
import { EnhancedCollaborationManager, type PresenceInfo } from '../lib/enhanced-collaboration';
import type { CollaborativeUser } from '../lib/collaborative';

interface PresenceIndicatorProps {
  manager: EnhancedCollaborationManager;
  currentFile: string;
}

export default function PresenceIndicator({ manager, currentFile }: PresenceIndicatorProps) {
  const [presences, setPresences] = useState<PresenceInfo[]>([]);
  const [stats, setStats] = useState(manager.getStats());

  useEffect(() => {
    // Update presences when they change
    const updatePresences = () => {
      setPresences(manager.getPresences());
      setStats(manager.getStats());
    };

    manager.on('user_joined', updatePresences);
    manager.on('user_left', updatePresences);
    manager.on('presence_update', updatePresences);

    // Initial update
    updatePresences();

    // Periodic update
    const interval = setInterval(updatePresences, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [manager]);

  const usersInCurrentFile = presences.filter(p => p.file === currentFile);
  const otherUsers = presences.filter(p => p.file !== currentFile);

  if (presences.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      {/* Users in current file */}
      {usersInCurrentFile.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--text-muted)]">Editing here:</span>
          <div className="flex -space-x-2">
            {usersInCurrentFile.map((presence, idx) => (
              <UserAvatar
                key={presence.user.id}
                user={presence.user}
                isTyping={presence.isTyping}
                size="sm"
                showTooltip={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Users in other files */}
      {otherUsers.length > 0 && (
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-[var(--text-muted)]">
            {otherUsers.length} other{otherUsers.length > 1 ? 's' : ''} editing
          </span>
          <div className="flex -space-x-2">
            {otherUsers.slice(0, 3).map((presence) => (
              <UserAvatar
                key={presence.user.id}
                user={presence.user}
                size="sm"
                showTooltip={true}
              />
            ))}
            {otherUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--bg-secondary)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                +{otherUsers.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats.conflictsResolved > 0 && (
        <div className="text-xs text-[var(--text-muted)] ml-2">
          {stats.conflictsResolved} conflict{stats.conflictsResolved > 1 ? 's' : ''} resolved
        </div>
      )}
    </div>
  );
}

interface UserAvatarProps {
  user: CollaborativeUser;
  isTyping?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

function UserAvatar({ user, isTyping = false, size = 'md', showTooltip = false }: UserAvatarProps) {
  const [showTooltipState, setShowTooltipState] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="relative"
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-[var(--bg-secondary)] flex items-center justify-center font-medium text-white relative`}
        style={{ backgroundColor: user.color }}
      >
        {initials}
        {isTyping && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltipState && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text)] text-xs rounded whitespace-nowrap z-50">
          {user.name}
          {isTyping && ' (typing...)'}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-[var(--bg-tertiary)] rotate-45" />
        </div>
      )}
    </div>
  );
}
