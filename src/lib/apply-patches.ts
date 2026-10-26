/**
 * Apply patches — apply diff patches to files.
 */

export interface PatchHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface Patch {
  path: string;
  hunks: PatchHunk[];
}

export function parsePatch(patchText: string): Patch[] {
  const patches: Patch[] = [];
  const lines = patchText.split('\n');
  let currentPatch: Patch | null = null;
  let currentHunk: PatchHunk | null = null;

  for (const line of lines) {
    if (line.startsWith('--- a/')) {
      // Start of new patch
      currentPatch = { path: line.slice(6), hunks: [] };
      patches.push(currentPatch);
    } else if (line.startsWith('+++ b/')) {
      // End of header, path already set
    } else if (line.startsWith('@@')) {
      // Start of new hunk
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (match && currentPatch) {
        currentHunk = {
          oldStart: parseInt(match[1]),
          oldLines: parseInt(match[2]) || 1,
          newStart: parseInt(match[3]),
          newLines: parseInt(match[4]) || 1,
          lines: [],
        };
        currentPatch.hunks.push(currentHunk);
      }
    } else if (currentHunk && (line.startsWith(' ') || line.startsWith('+') || line.startsWith('-'))) {
      currentHunk.lines.push(line);
    }
  }

  return patches;
}

export function applyPatch(content: string, patch: Patch): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let currentLine = 0;

  for (const hunk of patch.hunks) {
    // Add lines before this hunk
    while (currentLine < hunk.oldStart - 1) {
      result.push(lines[currentLine]);
      currentLine++;
    }

    // Apply hunk
    for (const line of hunk.lines) {
      if (line.startsWith(' ')) {
        // Context line
        result.push(lines[currentLine]);
        currentLine++;
      } else if (line.startsWith('-')) {
        // Remove line
        currentLine++;
      } else if (line.startsWith('+')) {
        // Add line
        result.push(line.slice(1));
      }
    }
  }

  // Add remaining lines
  while (currentLine < lines.length) {
    result.push(lines[currentLine]);
    currentLine++;
  }

  return result.join('\n');
}

export function createPatch(oldContent: string, newContent: string, path: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  let patch = `--- a/${path}\n+++ b/${path}\n`;
  
  // Simple diff: find first and last different lines
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) {
    start++;
  }
  
  let oldEnd = oldLines.length - 1;
  let newEnd = newLines.length - 1;
  while (oldEnd > start && newEnd > start && oldLines[oldEnd] === newLines[newEnd]) {
    oldEnd--;
    newEnd--;
  }
  
  if (start > oldEnd && start > newEnd) {
    return patch; // No changes
  }
  
  const contextLines = 3;
  const hunkStart = Math.max(0, start - contextLines);
  const hunkOldEnd = Math.min(oldLines.length - 1, oldEnd + contextLines);
  const hunkNewEnd = Math.min(newLines.length - 1, newEnd + contextLines);
  
  const oldCount = hunkOldEnd - hunkStart + 1;
  const newCount = hunkNewEnd - hunkStart + 1;
  
  patch += `@@ -${hunkStart + 1},${oldCount} +${hunkStart + 1},${newCount} @@\n`;
  
  for (let i = hunkStart; i <= hunkOldEnd; i++) {
    if (i <= oldEnd && i > newEnd) {
      patch += `-${oldLines[i]}\n`;
    } else if (i > oldEnd && i <= newEnd) {
      patch += `+${newLines[i]}\n`;
    } else {
      patch += ` ${oldLines[i]}\n`;
    }
  }
  
  return patch;
}
