/**
 * Advanced Code Executors — support for multiple programming languages.
 * Runs code in sandboxed environments with package management.
 */

export interface ExecutionResult {
  output: string;
  error?: string;
  exitCode: number;
  language: string;
  duration: number;
}

export interface PackageInfo {
  name: string;
  version: string;
  installed: boolean;
}

/* ─── Python Executor (via Pyodide when available) ─── */
export class PythonExecutor {
  private pyodide: any = null;
  private loading = false;
  private packages: Set<string> = new Set();

  async initialize(): Promise<boolean> {
    if (this.pyodide) return true;
    if (this.loading) return false;
    
    this.loading = true;
    try {
      // Load Pyodide from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
      
      // @ts-ignore
      this.pyodide = await (window as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      });
      
      this.loading = false;
      return true;
    } catch (e) {
      this.loading = false;
      return false;
    }
  }

  async execute(code: string): Promise<ExecutionResult> {
    const start = Date.now();
    
    if (!this.pyodide) {
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          output: '',
          error: 'Python runtime not available. Pyodide failed to load.',
          exitCode: 1,
          language: 'python',
          duration: Date.now() - start,
        };
      }
    }

    try {
      // Redirect stdout/stderr
      this.pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`);
      
      const result = await this.pyodide.runPythonAsync(code);
      
      const stdout = this.pyodide.runPython('sys.stdout.getvalue()');
      const stderr = this.pyodide.runPython('sys.stderr.getvalue()');
      
      let output = stdout;
      if (result !== undefined && result !== null) {
        output += String(result);
      }
      
      return {
        output: output.trim(),
        error: stderr || undefined,
        exitCode: 0,
        language: 'python',
        duration: Date.now() - start,
      };
    } catch (e: any) {
      return {
        output: '',
        error: e.message,
        exitCode: 1,
        language: 'python',
        duration: Date.now() - start,
      };
    }
  }

  async installPackage(name: string): Promise<PackageInfo> {
    if (this.packages.has(name)) {
      return { name, version: 'latest', installed: true };
    }
    
    if (!this.pyodide) {
      await this.initialize();
    }
    
    try {
      await this.pyodide.loadPackage(name);
      this.packages.add(name);
      return { name, version: 'latest', installed: true };
    } catch (e: any) {
      return { name, version: 'latest', installed: false };
    }
  }

  getInstalledPackages(): PackageInfo[] {
    return Array.from(this.packages).map(name => ({
      name,
      version: 'latest',
      installed: true,
    }));
  }
}

/* ─── SQL Executor (in-memory SQLite) ─── */
export class SQLExecutor {
  private tables: Map<string, { columns: string[]; rows: any[][] }> = new Map();

  execute(sql: string): ExecutionResult {
    const start = Date.now();
    const trimmed = sql.trim().toLowerCase();
    
    try {
      // CREATE TABLE
      if (trimmed.startsWith('create table')) {
        return this.executeCreateTable(sql);
      }
      
      // INSERT
      if (trimmed.startsWith('insert')) {
        return this.executeInsert(sql);
      }
      
      // SELECT
      if (trimmed.startsWith('select')) {
        return this.executeSelect(sql);
      }
      
      // DROP TABLE
      if (trimmed.startsWith('drop table')) {
        const match = sql.match(/drop table (?:if exists )?(\w+)/i);
        if (match) {
          this.tables.delete(match[1]);
          return {
            output: `Table dropped`,
            exitCode: 0,
            language: 'sql',
            duration: Date.now() - start,
          };
        }
      }
      
      return {
        output: '',
        error: `Unsupported SQL statement: ${sql.slice(0, 50)}`,
        exitCode: 1,
        language: 'sql',
        duration: Date.now() - start,
      };
    } catch (e: any) {
      return {
        output: '',
        error: e.message,
        exitCode: 1,
        language: 'sql',
        duration: Date.now() - start,
      };
    }
  }

  private executeCreateTable(sql: string): ExecutionResult {
    const start = Date.now();
    const match = sql.match(/create table (?:if not exists )?(\w+)\s*\(([^)]+)\)/i);
    if (!match) {
      return { output: '', error: 'Invalid CREATE TABLE syntax', exitCode: 1, language: 'sql', duration: Date.now() - start };
    }
    
    const tableName = match[1];
    const columns = match[2].split(',').map(c => c.trim().split(/\s+/)[0]);
    
    this.tables.set(tableName, { columns, rows: [] });
    
    return {
      output: `Table '${tableName}' created with columns: ${columns.join(', ')}`,
      exitCode: 0,
      language: 'sql',
      duration: Date.now() - start,
    };
  }

  private executeInsert(sql: string): ExecutionResult {
    const start = Date.now();
    const match = sql.match(/insert into (\w+)\s*(?:\(([^)]+)\))?\s*values\s*\(([^)]+)\)/i);
    if (!match) {
      return { output: '', error: 'Invalid INSERT syntax', exitCode: 1, language: 'sql', duration: Date.now() - start };
    }
    
    const tableName = match[1];
    const values = match[3].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
    const table = this.tables.get(tableName);
    
    if (!table) {
      return { output: '', error: `Table '${tableName}' does not exist`, exitCode: 1, language: 'sql', duration: Date.now() - start };
    }
    
    table.rows.push(values);
    
    return {
      output: `1 row inserted into '${tableName}'`,
      exitCode: 0,
      language: 'sql',
      duration: Date.now() - start,
    };
  }

  private executeSelect(sql: string): ExecutionResult {
    const start = Date.now();
    const match = sql.match(/select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+))?/i);
    if (!match) {
      return { output: '', error: 'Invalid SELECT syntax', exitCode: 1, language: 'sql', duration: Date.now() - start };
    }
    
    const columns = match[1].trim();
    const tableName = match[2];
    const whereClause = match[3];
    
    const table = this.tables.get(tableName);
    if (!table) {
      return { output: '', error: `Table '${tableName}' does not exist`, exitCode: 1, language: 'sql', duration: Date.now() - start };
    }
    
    let rows = table.rows;
    
    // Simple WHERE filtering
    if (whereClause) {
      const whereMatch = whereClause.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
      if (whereMatch) {
        const col = whereMatch[1];
        const val = whereMatch[2];
        const colIdx = table.columns.indexOf(col);
        if (colIdx >= 0) {
          rows = rows.filter(row => row[colIdx] === val);
        }
      }
    }
    
    // Format output
    let output = '';
    if (columns === '*') {
      output = table.columns.join(' | ') + '\n';
      output += '-'.repeat(output.length) + '\n';
      output += rows.map(row => row.join(' | ')).join('\n');
    } else {
      const selectedCols = columns.split(',').map(c => c.trim());
      const indices = selectedCols.map(c => table.columns.indexOf(c)).filter(i => i >= 0);
      output = selectedCols.join(' | ') + '\n';
      output += '-'.repeat(output.length) + '\n';
      output += rows.map(row => indices.map(i => row[i]).join(' | ')).join('\n');
    }
    
    if (rows.length === 0) {
      output = '(empty result set)';
    }
    
    return {
      output,
      exitCode: 0,
      language: 'sql',
      duration: Date.now() - start,
    };
  }

  listTables(): string[] {
    return Array.from(this.tables.keys());
  }
}

/* ─── Shell Executor (extended) ─── */
export class ShellExecutor {
  execute(command: string, env: Record<string, string> = {}): ExecutionResult {
    const start = Date.now();
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    
    switch (cmd) {
      case 'echo':
        return { output: args.join(' '), exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      case 'date':
        return { output: new Date().toISOString(), exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      case 'env':
        return { output: Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'), exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      case 'sleep':
        // Can't actually sleep in browser, just return
        return { output: '', exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      case 'uname':
        return { output: 'Browser/JS', exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      case 'whoami':
        return { output: 'rs-builder-user', exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      case 'node':
      case 'npm':
      case 'npx':
        return { output: `Simulated: ${command}\n(Node.js commands are executed via run_code tool)`, exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      case 'python':
      case 'python3':
        return { output: `Use run_code tool with language="python" for Python execution`, exitCode: 0, language: 'shell', duration: Date.now() - start };
      
      default:
        return { output: '', error: `Command not found: ${cmd}`, exitCode: 127, language: 'shell', duration: Date.now() - start };
    }
  }
}

/* ─── Language detection ─── */
export function detectLanguage(code: string, hint?: string): string {
  if (hint) return hint;
  
  // Python indicators
  if (code.includes('import ') && (code.includes('def ') || code.includes('print(') || code.includes(':'))) {
    if (!code.includes('function ') && !code.includes('const ') && !code.includes('=>')) {
      return 'python';
    }
  }
  
  // SQL indicators
  if (/^\s*(select|insert|create|update|delete|drop)\s/i.test(code)) {
    return 'sql';
  }
  
  // Shell indicators
  if (/^\s*(echo|ls|cd|cat|grep|find|mkdir|rm|cp|mv)\s/i.test(code)) {
    return 'shell';
  }
  
  // Default to JavaScript
  return 'javascript';
}
