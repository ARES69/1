/**
 * AI Debugger — automatic error analysis and fix suggestions.
 * Analyzes stack traces, suggests fixes, and provides debugging insights.
 */

export interface ErrorAnalysis {
  errorType: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  suggestions: FixSuggestion[];
  context?: string;
}

export interface FixSuggestion {
  description: string;
  code?: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
}

/* ─── Error Pattern Matching ─── */
const ERROR_PATTERNS = [
  {
    pattern: /TypeError: Cannot read propert(?:y|ies) '(\w+)' of (undefined|null)/,
    type: 'TypeError',
    severity: 'error' as const,
    suggestions: [
      {
        description: 'Add null/undefined check before accessing property',
        code: 'if (obj && obj.property) { ... }',
        confidence: 'high' as const,
        explanation: 'The object is undefined or null. Add a check before accessing its properties.',
      },
      {
        description: 'Use optional chaining',
        code: 'obj?.property',
        confidence: 'high' as const,
        explanation: 'Use optional chaining (?.) to safely access nested properties.',
      },
    ],
  },
  {
    pattern: /ReferenceError: (\w+) is not defined/,
    type: 'ReferenceError',
    severity: 'error' as const,
    suggestions: [
      {
        description: 'Declare the variable before using it',
        code: 'let variableName;',
        confidence: 'high' as const,
        explanation: 'The variable is used but not declared. Add a declaration.',
      },
      {
        description: 'Check for typos in variable name',
        confidence: 'medium' as const,
        explanation: 'Verify the variable name is spelled correctly.',
      },
    ],
  },
  {
    pattern: /SyntaxError: Unexpected token '?(\w+)'?/,
    type: 'SyntaxError',
    severity: 'error' as const,
    suggestions: [
      {
        description: 'Check for missing brackets, parentheses, or semicolons',
        confidence: 'high' as const,
        explanation: 'Syntax errors often occur due to missing or extra brackets/parentheses.',
      },
      {
        description: 'Verify string quotes are properly closed',
        confidence: 'medium' as const,
        explanation: 'Unclosed strings can cause unexpected token errors.',
      },
    ],
  },
  {
    pattern: /RangeError: Maximum call stack size exceeded/,
    type: 'RangeError',
    severity: 'error' as const,
    suggestions: [
      {
        description: 'Check for infinite recursion',
        confidence: 'high' as const,
        explanation: 'This error indicates infinite recursion. Add a base case to your recursive function.',
      },
      {
        description: 'Add recursion depth limit',
        code: 'if (depth > MAX_DEPTH) return;',
        confidence: 'medium' as const,
        explanation: 'Add a depth counter to prevent infinite recursion.',
      },
    ],
  },
  {
    pattern: /NetworkError|Failed to fetch|CORS/,
    type: 'NetworkError',
    severity: 'error' as const,
    suggestions: [
      {
        description: 'Check if the API endpoint is accessible',
        confidence: 'high' as const,
        explanation: 'Verify the URL is correct and the server is running.',
      },
      {
        description: 'Add CORS headers on the server',
        code: 'Access-Control-Allow-Origin: *',
        confidence: 'medium' as const,
        explanation: 'If this is a CORS error, the server needs to allow cross-origin requests.',
      },
    ],
  },
  {
    pattern: /404|Not Found/,
    type: 'HTTPError',
    severity: 'warning' as const,
    suggestions: [
      {
        description: 'Verify the URL or file path is correct',
        confidence: 'high' as const,
        explanation: 'The requested resource does not exist. Check the path.',
      },
    ],
  },
  {
    pattern: /401|Unauthorized/,
    type: 'HTTPError',
    severity: 'error' as const,
    suggestions: [
      {
        description: 'Check authentication credentials',
        confidence: 'high' as const,
        explanation: 'The request requires authentication. Verify API keys or tokens.',
      },
    ],
  },
  {
    pattern: /429|Too Many Requests/,
    type: 'HTTPError',
    severity: 'warning' as const,
    suggestions: [
      {
        description: 'Add rate limiting or delays between requests',
        code: 'await new Promise(r => setTimeout(r, 1000));',
        confidence: 'high' as const,
        explanation: 'You are hitting rate limits. Add delays between requests.',
      },
    ],
  },
];

/* ─── Main Analysis Function ─── */
export function analyzeError(error: string, context?: string): ErrorAnalysis {
  // Try to match against known patterns
  for (const pattern of ERROR_PATTERNS) {
    const match = error.match(pattern.pattern);
    if (match) {
      return {
        errorType: pattern.type,
        message: error,
        severity: pattern.severity,
        suggestions: pattern.suggestions,
        context,
      };
    }
  }

  // Try to extract file/line info
  const locationMatch = error.match(/at\s+(?:.+?\s+)?\(?([^:]+):(\d+):(\d+)\)?/);
  const file = locationMatch?.[1];
  const line = locationMatch ? parseInt(locationMatch[2]) : undefined;
  const column = locationMatch ? parseInt(locationMatch[3]) : undefined;

  // Generic error analysis
  return {
    errorType: 'UnknownError',
    message: error,
    file,
    line,
    column,
    severity: 'error',
    suggestions: [
      {
        description: 'Check the error message for specific details',
        confidence: 'medium',
        explanation: 'Review the full error message for clues about what went wrong.',
      },
      {
        description: 'Add console.log statements to debug',
        code: 'console.log("Debug:", variable);',
        confidence: 'low',
        explanation: 'Add logging to understand the state when the error occurs.',
      },
    ],
    context,
  };
}

/* ─── Stack Trace Parser ─── */
export function parseStackTrace(stack: string): Array<{
  function: string;
  file: string;
  line: number;
  column: number;
}> {
  const frames: Array<{ function: string; file: string; line: number; column: number }> = [];
  
  const lines = stack.split('\n');
  for (const line of lines) {
    const match = line.match(/at\s+(?:(.+?)\s+)?\(?([^:]+):(\d+):(\d+)\)?/);
    if (match) {
      frames.push({
        function: match[1] || '<anonymous>',
        file: match[2],
        line: parseInt(match[3]),
        column: parseInt(match[4]),
      });
    }
  }
  
  return frames;
}

/* ─── Performance Analyzer ─── */
export interface PerformanceIssue {
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export function analyzePerformance(code: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  // Check for synchronous operations in loops
  if (/for\s*\([^)]*\)\s*\{[^}]*await/.test(code)) {
    issues.push({
      type: 'SequentialAsync',
      description: 'Sequential async operations in loop',
      impact: 'high',
      suggestion: 'Use Promise.all() for parallel execution',
    });
  }

  // Check for large array operations
  if (/\.(map|filter|reduce)\(/.test(code) && code.length > 1000) {
    issues.push({
      type: 'LargeArrayOperation',
      description: 'Array operations on potentially large datasets',
      impact: 'medium',
      suggestion: 'Consider using for loops for better performance on large arrays',
    });
  }

  // Check for missing memoization
  if (/useState|useEffect/.test(code) && !/useMemo|useCallback/.test(code)) {
    issues.push({
      type: 'MissingMemoization',
      description: 'React component without memoization',
      impact: 'medium',
      suggestion: 'Consider using useMemo or useCallback for expensive computations',
    });
  }

  // Check for DOM queries in loops
  if (/for.*querySelector|for.*getElementById/.test(code)) {
    issues.push({
      type: 'DOMQueryInLoop',
      description: 'DOM queries inside loop',
      impact: 'high',
      suggestion: 'Cache DOM references outside the loop',
    });
  }

  return issues;
}

/* ─── Security Analyzer ─── */
export interface SecurityIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  line?: number;
  suggestion: string;
}

export function analyzeSecurity(code: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    // Check for eval()
    if (/\beval\s*\(/.test(line)) {
      issues.push({
        type: 'EvalUsage',
        severity: 'critical',
        description: 'Use of eval() is a security risk',
        line: idx + 1,
        suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() or Function constructor.',
      });
    }

    // Check for innerHTML with user input
    if (/innerHTML\s*=/.test(line) && !/textContent|innerText/.test(line)) {
      issues.push({
        type: 'InnerHTMLUsage',
        severity: 'high',
        description: 'innerHTML can lead to XSS vulnerabilities',
        line: idx + 1,
        suggestion: 'Use textContent or sanitize input before using innerHTML.',
      });
    }

    // Check for hardcoded credentials
    if (/password|api[_-]?key|secret|token/i.test(line) && /['"][^'"]{8,}['"]/.test(line)) {
      issues.push({
        type: 'HardcodedCredentials',
        severity: 'high',
        description: 'Potential hardcoded credentials detected',
        line: idx + 1,
        suggestion: 'Use environment variables or secure storage for credentials.',
      });
    }

    // Check for http:// URLs
    if (/http:\/\//.test(line) && !/localhost|127\.0\.0\.1/.test(line)) {
      issues.push({
        type: 'InsecureHTTP',
        severity: 'medium',
        description: 'Using HTTP instead of HTTPS',
        line: idx + 1,
        suggestion: 'Use HTTPS for all external requests.',
      });
    }
  });

  return issues;
}

/* ─── Comprehensive Analysis ─── */
export function comprehensiveAnalysis(
  error: string,
  code: string,
  stack?: string
): {
  errorAnalysis: ErrorAnalysis;
  performanceIssues: PerformanceIssue[];
  securityIssues: SecurityIssue[];
  stackFrames?: Array<{ function: string; file: string; line: number; column: number }>;
} {
  return {
    errorAnalysis: analyzeError(error, code),
    performanceIssues: analyzePerformance(code),
    securityIssues: analyzeSecurity(code),
    stackFrames: stack ? parseStackTrace(stack) : undefined,
  };
}
