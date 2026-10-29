/**
 * Enhanced Security — additional security features and protections.
 * Provides content security, input validation, and audit logging.
 */

export interface SecurityEvent {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'input' | 'output' | 'access' | 'system';
  message: string;
  details?: any;
  timestamp: number;
  resolved: boolean;
}

export interface SecurityPolicy {
  maxInputLength: number;
  maxOutputLength: number;
  allowedFileTypes: string[];
  blockedPatterns: string[];
  enableAuditLog: boolean;
  maxAuditLogSize: number;
}

const SECURITY_EVENTS_KEY = 'rsb-security-events';
const SECURITY_POLICY_KEY = 'rsb-security-policy';

/* ─── Default Security Policy ─── */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  maxInputLength: 10000,
  maxOutputLength: 100000,
  allowedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.json', '.md', '.py', '.sql'],
  blockedPatterns: [
    'eval(',
    'Function(',
    'innerHTML',
    'document.write',
    '<script>',
    'javascript:',
  ],
  enableAuditLog: true,
  maxAuditLogSize: 1000,
};

/* ─── Security Event Storage ─── */
export function loadSecurityEvents(): SecurityEvent[] {
  try {
    const raw = localStorage.getItem(SECURITY_EVENTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load security events:', e);
  }
  return [];
}

export function saveSecurityEvents(events: SecurityEvent[]): void {
  try {
    localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn('Failed to save security events:', e);
  }
}

export function addSecurityEvent(
  type: SecurityEvent['type'],
  category: SecurityEvent['category'],
  message: string,
  details?: any
): SecurityEvent {
  const event: SecurityEvent = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    category,
    message,
    details,
    timestamp: Date.now(),
    resolved: false,
  };
  
  const events = loadSecurityEvents();
  events.unshift(event);
  
  // Trim to max size
  const policy = loadSecurityPolicy();
  if (events.length > policy.maxAuditLogSize) {
    events.splice(policy.maxAuditLogSize);
  }
  
  saveSecurityEvents(events);
  
  return event;
}

export function resolveSecurityEvent(id: string): void {
  const events = loadSecurityEvents();
  const event = events.find(e => e.id === id);
  
  if (event) {
    event.resolved = true;
    saveSecurityEvents(events);
  }
}

export function clearSecurityEvents(): void {
  localStorage.removeItem(SECURITY_EVENTS_KEY);
}

/* ─── Security Policy Storage ─── */
export function loadSecurityPolicy(): SecurityPolicy {
  try {
    const raw = localStorage.getItem(SECURITY_POLICY_KEY);
    if (raw) {
      return { ...DEFAULT_SECURITY_POLICY, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load security policy:', e);
  }
  return DEFAULT_SECURITY_POLICY;
}

export function saveSecurityPolicy(policy: SecurityPolicy): void {
  try {
    localStorage.setItem(SECURITY_POLICY_KEY, JSON.stringify(policy));
  } catch (e) {
    console.warn('Failed to save security policy:', e);
  }
}

/* ─── Input Validation ─── */
export function validateInput(input: string, policy: SecurityPolicy = loadSecurityPolicy()): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check length
  if (input.length > policy.maxInputLength) {
    errors.push(`Input exceeds maximum length of ${policy.maxInputLength} characters`);
  }
  
  // Check for blocked patterns
  for (const pattern of policy.blockedPatterns) {
    if (input.includes(pattern)) {
      warnings.push(`Potentially dangerous pattern detected: ${pattern}`);
      addSecurityEvent('warning', 'input', `Blocked pattern detected: ${pattern}`, { pattern, inputLength: input.length });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/* ─── Output Validation ─── */
export function validateOutput(output: string, policy: SecurityPolicy = loadSecurityPolicy()): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check length
  if (output.length > policy.maxOutputLength) {
    errors.push(`Output exceeds maximum length of ${policy.maxOutputLength} characters`);
  }
  
  // Check for dangerous content
  if (output.includes('<script>') || output.includes('</script>')) {
    warnings.push('Script tags detected in output');
    addSecurityEvent('warning', 'output', 'Script tags detected in output', { outputLength: output.length });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/* ─── File Type Validation ─── */
export function validateFileType(filename: string, policy: SecurityPolicy = loadSecurityPolicy()): {
  valid: boolean;
  error?: string;
} {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!policy.allowedFileTypes.includes(ext)) {
    return {
      valid: false,
      error: `File type ${ext} is not allowed. Allowed types: ${policy.allowedFileTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/* ─── Content Sanitization ─── */
export function sanitizeHTML(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  return sanitized;
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
}

/* ─── Rate Limiting ─── */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create request history
    let history = this.requests.get(key) || [];
    
    // Remove old requests
    history = history.filter(time => time > windowStart);
    
    // Check if allowed
    const allowed = history.length < this.maxRequests;
    
    if (allowed) {
      history.push(now);
      this.requests.set(key, history);
    }
    
    const remaining = Math.max(0, this.maxRequests - history.length);
    const resetIn = history.length > 0 ? Math.max(0, history[0] + this.windowMs - now) : 0;
    
    if (!allowed) {
      addSecurityEvent('warning', 'access', `Rate limit exceeded for key: ${key}`, { key, requests: history.length });
    }
    
    return { allowed, remaining, resetIn };
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

/* ─── Security Audit Report ─── */
export function generateSecurityReport(): {
  totalEvents: number;
  unresolvedEvents: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  recentEvents: SecurityEvent[];
} {
  const events = loadSecurityEvents();
  
  const eventsByType: Record<string, number> = {};
  const eventsByCategory: Record<string, number> = {};
  
  for (const event of events) {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
  }
  
  return {
    totalEvents: events.length,
    unresolvedEvents: events.filter(e => !e.resolved).length,
    eventsByType,
    eventsByCategory,
    recentEvents: events.slice(0, 10),
  };
}
