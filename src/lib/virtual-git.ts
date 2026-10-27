/**
 * Virtual Git — browser-based git implementation for version control.
 * Provides commit history, diff tracking, and branch management.
 */

import type { VirtualFS } from './virtual-fs';

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  files: Record<string, string>;
  parent?: string;
}

export interface GitBranch {
  name: string;
  currentCommit: string;
  commits: string[];
}

export interface GitStatus {
  staged: string[];
  modified: string[];
  untracked: string[];
  deleted: string[];
}

export class VirtualGit {
  private commits: Map<string, GitCommit> = new Map();
  private branches: Map<string, GitBranch> = new Map();
  private currentBranch: string = 'main';
  private stagingArea: Set<string> = new Set();
  private lastSnapshot: Record<string, string> = {};

  constructor() {
    // Initialize main branch
    this.branches.set('main', {
      name: 'main',
      currentCommit: '',
      commits: [],
    });
  }

  /**
   * Generate a short hash for a commit
   */
  private generateHash(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Get current branch
   */
  getCurrentBranch(): string {
    return this.currentBranch;
  }

  /**
   * List all branches
   */
  listBranches(): string[] {
    return Array.from(this.branches.keys());
  }

  /**
   * Create a new branch
   */
  createBranch(name: string, fromBranch: string = this.currentBranch): boolean {
    if (this.branches.has(name)) {
      return false;
    }

    const sourceBranch = this.branches.get(fromBranch);
    if (!sourceBranch) {
      return false;
    }

    this.branches.set(name, {
      name,
      currentCommit: sourceBranch.currentCommit,
      commits: [...sourceBranch.commits],
    });

    return true;
  }

  /**
   * Switch to a different branch
   */
  checkout(branchName: string): boolean {
    if (!this.branches.has(branchName)) {
      return false;
    }

    this.currentBranch = branchName;
    this.stagingArea.clear();
    return true;
  }

  /**
   * Stage files for commit
   */
  stage(files: string[]): void {
    files.forEach(file => this.stagingArea.add(file));
  }

  /**
   * Unstage files
   */
  unstage(files: string[]): void {
    files.forEach(file => this.stagingArea.delete(file));
  }

  /**
   * Stage all modified files
   */
  stageAll(fs: VirtualFS): void {
    const allFiles = fs.getAll();
    allFiles.forEach(file => this.stagingArea.add(file.path));
  }

  /**
   * Get git status
   */
  getStatus(fs: VirtualFS): GitStatus {
    const currentFiles = new Set(fs.getAll().map(f => f.path));
    const lastFiles = new Set(Object.keys(this.lastSnapshot));

    const staged = Array.from(this.stagingArea);
    const modified: string[] = [];
    const untracked: string[] = [];
    const deleted: string[] = [];

    // Check for modified and untracked
    for (const file of currentFiles) {
      const content = fs.read(file);
      const lastContent = this.lastSnapshot[file];

      if (!lastContent) {
        untracked.push(file);
      } else if (content !== lastContent) {
        modified.push(file);
      }
    }

    // Check for deleted
    for (const file of lastFiles) {
      if (!currentFiles.has(file)) {
        deleted.push(file);
      }
    }

    return { staged, modified, untracked, deleted };
  }

  /**
   * Create a commit
   */
  commit(message: string, author: string = 'AI Agent', fs: VirtualFS): GitCommit | null {
    const branch = this.branches.get(this.currentBranch);
    if (!branch) {
      return null;
    }

    // Get all staged files
    const files: Record<string, string> = {};
    for (const filePath of this.stagingArea) {
      const content = fs.read(filePath);
      if (content !== null) {
        files[filePath] = content;
      }
    }

    // If no files staged, commit all current files
    if (Object.keys(files).length === 0) {
      const allFiles = fs.getAll();
      allFiles.forEach(file => {
        files[file.path] = file.content;
      });
    }

    if (Object.keys(files).length === 0) {
      return null; // Nothing to commit
    }

    const commit: GitCommit = {
      hash: this.generateHash(),
      message,
      author,
      timestamp: Date.now(),
      files: { ...files },
      parent: branch.currentCommit || undefined,
    };

    this.commits.set(commit.hash, commit);
    branch.currentCommit = commit.hash;
    branch.commits.push(commit.hash);

    // Update last snapshot
    this.lastSnapshot = { ...files };
    this.stagingArea.clear();

    return commit;
  }

  /**
   * Get commit history
   */
  getHistory(limit: number = 10): GitCommit[] {
    const branch = this.branches.get(this.currentBranch);
    if (!branch) {
      return [];
    }

    const commits: GitCommit[] = [];
    const commitHashes = branch.commits.slice(-limit).reverse();

    for (const hash of commitHashes) {
      const commit = this.commits.get(hash);
      if (commit) {
        commits.push(commit);
      }
    }

    return commits;
  }

  /**
   * Get a specific commit
   */
  getCommit(hash: string): GitCommit | null {
    return this.commits.get(hash) || null;
  }

  /**
   * Checkout a specific commit (detached HEAD)
   */
  checkoutCommit(hash: string, fs: VirtualFS): boolean {
    const commit = this.commits.get(hash);
    if (!commit) {
      return false;
    }

    // Clear filesystem and restore commit state
    fs.clear();
    for (const [path, content] of Object.entries(commit.files)) {
      fs.write(path, content);
    }

    this.lastSnapshot = { ...commit.files };
    return true;
  }

  /**
   * Get diff between two commits
   */
  getDiff(hash1: string, hash2: string): { added: string[]; removed: string[]; modified: string[] } {
    const commit1 = this.commits.get(hash1);
    const commit2 = this.commits.get(hash2);

    if (!commit1 || !commit2) {
      return { added: [], removed: [], modified: [] };
    }

    const files1 = new Set(Object.keys(commit1.files));
    const files2 = new Set(Object.keys(commit2.files));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Find added files
    for (const file of files2) {
      if (!files1.has(file)) {
        added.push(file);
      }
    }

    // Find removed files
    for (const file of files1) {
      if (!files2.has(file)) {
        removed.push(file);
      }
    }

    // Find modified files
    for (const file of files2) {
      if (files1.has(file) && commit1.files[file] !== commit2.files[file]) {
        modified.push(file);
      }
    }

    return { added, removed, modified };
  }

  /**
   * Export git state to JSON
   */
  exportState(): string {
    return JSON.stringify({
      commits: Array.from(this.commits.entries()),
      branches: Array.from(this.branches.entries()),
      currentBranch: this.currentBranch,
      lastSnapshot: this.lastSnapshot,
    }, null, 2);
  }

  /**
   * Import git state from JSON
   */
  importState(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.commits = new Map(data.commits);
      this.branches = new Map(data.branches);
      this.currentBranch = data.currentBranch;
      this.lastSnapshot = data.lastSnapshot;
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Generate AI-powered commit message based on changes
 */
export function generateCommitMessage(changes: { added: string[]; removed: string[]; modified: string[] }): string {
  const parts: string[] = [];

  if (changes.added.length > 0) {
    parts.push(`Add ${changes.added.length} file${changes.added.length > 1 ? 's' : ''}`);
  }

  if (changes.removed.length > 0) {
    parts.push(`Remove ${changes.removed.length} file${changes.removed.length > 1 ? 's' : ''}`);
  }

  if (changes.modified.length > 0) {
    parts.push(`Update ${changes.modified.length} file${changes.modified.length > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'Initial commit';
  }

  return parts.join(', ');
}
