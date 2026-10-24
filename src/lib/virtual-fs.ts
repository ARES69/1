/**
 * Virtual filesystem for the agent sandbox.
 * Files are stored in memory as a Map<path, content>.
 */

export class VirtualFS {
  private files: Map<string, string> = new Map();

  write(path: string, content: string): void {
    // Normalize path
    const normalized = this.normalizePath(path);
    this.files.set(normalized, content);
  }

  read(path: string): string | null {
    const normalized = this.normalizePath(path);
    return this.files.get(normalized) ?? null;
  }

  delete(path: string): boolean {
    const normalized = this.normalizePath(path);
    return this.files.delete(normalized);
  }

  exists(path: string): boolean {
    const normalized = this.normalizePath(path);
    return this.files.has(normalized);
  }

  list(dir?: string): { name: string; path: string; type: 'file' | 'folder' }[] {
    const result: { name: string; path: string; type: 'file' | 'folder' }[] = [];
    const prefix = dir ? this.normalizePath(dir) + '/' : '';
    const seen = new Set<string>();

    for (const filePath of this.files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const relative = filePath.slice(prefix.length);
      const parts = relative.split('/');
      
      if (parts.length === 1) {
        // Direct file in this directory
        if (!seen.has(parts[0])) {
          seen.add(parts[0]);
          result.push({ name: parts[0], path: filePath, type: 'file' });
        }
      } else {
        // Subfolder
        const folderName = parts[0];
        if (!seen.has(folderName)) {
          seen.add(folderName);
          result.push({ name: folderName, path: prefix + folderName, type: 'folder' });
        }
      }
    }

    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  getAll(): { path: string; content: string }[] {
    return Array.from(this.files.entries()).map(([path, content]) => ({ path, content }));
  }

  clear(): void {
    this.files.clear();
  }

  private normalizePath(path: string): string {
    // Remove leading slash, normalize
    let p = path.replace(/^\/+/, '').replace(/\/+/g, '/');
    // Remove trailing slash
    if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1);
    return p;
  }

  /**
   * Export all files as a downloadable zip-like structure.
   */
  exportAsJSON(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [path, content] of this.files.entries()) {
      result[path] = content;
    }
    return result;
  }

  /**
   * Import files from JSON.
   */
  importFromJSON(data: Record<string, string>): void {
    for (const [path, content] of Object.entries(data)) {
      this.write(path, content);
    }
  }
}
