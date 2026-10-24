/**
 * Memory — persistent project context between sessions.
 * Stores conversation history, file states, and user preferences per project.
 */

import type { VirtualFS } from './virtual-fs';

export interface MemoryEntry {
  id: string;
  projectId: string;
  prompt: string;
  summary: string;
  files: Record<string, string>;
  createdAt: string;
  tokensUsed: number;
}

export interface Checkpoint {
  id: string;
  projectId: string;
  label: string;
  files: Record<string, string>;
  messageIndex: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  memories: MemoryEntry[];
  checkpoints: Checkpoint[];
}

const PROJECTS_KEY = 'rsb-projects';
const ACTIVE_PROJECT_KEY = 'rsb-active-project';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function listProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  return listProjects().find(p => p.id === id) || null;
}

export function createProject(name: string): Project {
  const project: Project = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memories: [],
    checkpoints: [],
  };
  const projects = listProjects();
  projects.push(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  return project;
}

export function updateProject(project: Project): void {
  const projects = listProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    project.updatedAt = new Date().toISOString();
    projects[idx] = project;
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}

export function deleteProject(id: string): void {
  const projects = listProjects().filter(p => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (localStorage.getItem(ACTIVE_PROJECT_KEY) === id) {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function addMemory(project: Project, prompt: string, summary: string, fs: VirtualFS, tokensUsed: number): MemoryEntry {
  const memory: MemoryEntry = {
    id: generateId(),
    projectId: project.id,
    prompt,
    summary,
    files: fs.exportAsJSON(),
    createdAt: new Date().toISOString(),
    tokensUsed,
  };
  project.memories.push(memory);
  updateProject(project);
  return memory;
}

export function createCheckpoint(project: Project, label: string, fs: VirtualFS, messageIndex: number): Checkpoint {
  const checkpoint: Checkpoint = {
    id: generateId(),
    projectId: project.id,
    label,
    files: fs.exportAsJSON(),
    messageIndex,
    createdAt: new Date().toISOString(),
  };
  project.checkpoints.push(checkpoint);
  updateProject(project);
  return checkpoint;
}

export function restoreCheckpoint(project: Project, checkpointId: string): Record<string, string> | null {
  const checkpoint = project.checkpoints.find(c => c.id === checkpointId);
  return checkpoint ? checkpoint.files : null;
}
