/**
 * Project instructions — CLAUDE.md file support.
 * Stores project-specific context that gets injected into every prompt.
 */

export interface ProjectInstructions {
  content: string;
  lastModified: number;
}

const PROJECT_INSTRUCTIONS_KEY = 'rsb-project-instructions';

export function loadProjectInstructions(): ProjectInstructions {
  try {
    const raw = localStorage.getItem(PROJECT_INSTRUCTIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load project instructions:', e);
  }
  return { content: '', lastModified: Date.now() };
}

export function saveProjectInstructions(content: string): void {
  const instructions: ProjectInstructions = {
    content,
    lastModified: Date.now(),
  };
  try {
    localStorage.setItem(PROJECT_INSTRUCTIONS_KEY, JSON.stringify(instructions));
  } catch (e) {
    console.warn('Failed to save project instructions:', e);
  }
}

export function clearProjectInstructions(): void {
  localStorage.removeItem(PROJECT_INSTRUCTIONS_KEY);
}

/**
 * Format instructions for injection into system prompt.
 */
export function formatInstructionsForPrompt(instructions: string): string {
  if (!instructions.trim()) return '';
  
  return `

<project_instructions>
${instructions}
</project_instructions>

Follow these project-specific instructions when generating code and making decisions.
`;
}

/**
 * Default template for CLAUDE.md
 */
export const DEFAULT_INSTRUCTIONS_TEMPLATE = `# Project Instructions

## Tech Stack
- Framework: React 18 + TypeScript
- Styling: Tailwind CSS
- Build tool: Vite

## Code Style
- Use functional components with hooks
- Prefer TypeScript interfaces over types
- Use named exports for components
- Keep components small and focused

## Project Structure
- Components in src/components/
- Pages in src/pages/
- Utilities in src/lib/

## Conventions
- Use semantic HTML elements
- Follow accessibility best practices
- Write descriptive variable names
- Add comments for complex logic

## Testing
- Write unit tests for utilities
- Test components with React Testing Library
`;
