/**
 * Permission system — request user approval before dangerous operations.
 */

export type PermissionLevel = 'safe' | 'caution' | 'dangerous';

export interface PermissionRequest {
  id: string;
  tool: string;
  description: string;
  level: PermissionLevel;
  details: string;
  timestamp: number;
}

export interface PermissionDecision {
  request: PermissionRequest;
  granted: boolean;
  remember: boolean;
}

// Tools that are always safe (no permission needed)
const SAFE_TOOLS = new Set([
  'read_file',
  'list_files',
  'run_code',
  'finish',
]);

// Tools that need caution
const CAUTION_TOOLS = new Set([
  'write_file',
  'edit_file',
]);

// Tools that are dangerous
const DANGEROUS_TOOLS = new Set([
  'delete_file',
  'run_shell',
]);

export function getPermissionLevel(tool: string): PermissionLevel {
  if (SAFE_TOOLS.has(tool)) return 'safe';
  if (CAUTION_TOOLS.has(tool)) return 'caution';
  if (DANGEROUS_TOOLS.has(tool)) return 'dangerous';
  return 'caution'; // Default to caution for unknown tools
}

export function needsPermission(tool: string): boolean {
  return getPermissionLevel(tool) !== 'safe';
}

export function createPermissionRequest(
  tool: string,
  args: Record<string, any>
): PermissionRequest {
  const level = getPermissionLevel(tool);
  let description = '';
  let details = '';

  switch (tool) {
    case 'write_file':
      description = `Write to file: ${args.path}`;
      details = `Creating or overwriting file at ${args.path} (${args.content?.length || 0} bytes)`;
      break;
    case 'edit_file':
      description = `Edit file: ${args.path}`;
      details = `Modifying file at ${args.path}`;
      break;
    case 'delete_file':
      description = `Delete file: ${args.path}`;
      details = `Permanently deleting file at ${args.path}`;
      break;
    case 'run_shell':
      description = `Execute shell command: ${args.command}`;
      details = `Running: ${args.command}`;
      break;
    default:
      description = `Execute ${tool}`;
      details = JSON.stringify(args, null, 2);
  }

  return {
    id: 'perm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    tool,
    description,
    level,
    details,
    timestamp: Date.now(),
  };
}

export class PermissionManager {
  private rememberedPermissions: Map<string, boolean> = new Map();

  constructor() {
    // Load from localStorage
    try {
      const saved = localStorage.getItem('rsb-permissions');
      if (saved) {
        const data = JSON.parse(saved);
        this.rememberedPermissions = new Map(Object.entries(data));
      }
    } catch (e) {
      console.warn('Failed to load permissions:', e);
    }
  }

  hasPermission(tool: string): boolean {
    // Safe tools always have permission
    if (getPermissionLevel(tool) === 'safe') return true;
    
    // Check remembered permissions
    return this.rememberedPermissions.get(tool) === true;
  }

  rememberPermission(tool: string, granted: boolean): void {
    this.rememberedPermissions.set(tool, granted);
    this.save();
  }

  clearRememberedPermissions(): void {
    this.rememberedPermissions.clear();
    this.save();
  }

  private save(): void {
    try {
      const data = Object.fromEntries(this.rememberedPermissions);
      localStorage.setItem('rsb-permissions', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save permissions:', e);
    }
  }
}
