/**
 * FileEditor — Monaco-like editor with syntax highlighting, diff view, and line numbers.
 * Pure React implementation, no heavy dependencies.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Save, Undo, Copy, Check, Download, GitCompare } from 'lucide-react';

interface FileEditorProps {
  path: string;
  content: string;
  originalContent?: string; // for diff view
  onChange?: (content: string) => void;
  onClose: () => void;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

// Simple syntax highlighting rules
const LANG_RULES: Record<string, { keywords: string[]; comment: string; string: string }> = {
  javascript: { keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined'], comment: '//', string: '"' },
  typescript: { keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'interface', 'type', 'enum', 'extends', 'implements'], comment: '//', string: '"' },
  html: { keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link', 'meta', 'title', 'h1', 'h2', 'h3', 'ul', 'li', 'form', 'input', 'button'], comment: '<!--', string: '"' },
  css: { keywords: ['color', 'background', 'margin', 'padding', 'border', 'font', 'display', 'flex', 'grid', 'width', 'height', 'position', 'top', 'left', 'right', 'bottom'], comment: '/*', string: '"' },
  json: { keywords: ['true', 'false', 'null'], comment: '//', string: '"' },
};

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    html: 'html', htm: 'html', css: 'css', json: 'json', md: 'markdown',
  };
  return map[ext] || 'text';
}

function highlightLine(line: string, lang: string): string {
  const rules = LANG_RULES[lang];
  if (!rules) return escapeHtml(line);
  
  let result = escapeHtml(line);
  
  // Highlight strings
  result = result.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '<span class="text-emerald-400">$&</span>');
  
  // Highlight comments
  if (rules.comment === '//') {
    result = result.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  }
  
  // Highlight keywords
  for (const kw of rules.keywords) {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    result = result.replace(regex, '<span class="text-purple-400 font-medium">$1</span>');
  }
  
  // Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-orange-400">$1</span>');
  
  return result;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function FileEditor({ path, content, originalContent, onChange, onClose, onSave, readOnly }: FileEditorProps) {
  const [value, setValue] = useState(content);
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const lang = detectLanguage(path);

  useEffect(() => {
    setValue(content);
  }, [content]);

  const lines = value.split('\n');
  const originalLines = originalContent ? originalContent.split('\n') : [];

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleSave = () => {
    onSave?.(value);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute diff
  const diffLines = useMemo(() => {
    if (!originalContent || !showDiff) return null;
    
    const result: { type: 'same' | 'added' | 'removed'; lineNum?: number; content: string }[] = [];
    const maxLen = Math.max(lines.length, originalLines.length);
    
    // Simple line-by-line diff (not optimal but good enough for display)
    let origIdx = 0;
    let newIdx = 0;
    
    while (origIdx < originalLines.length || newIdx < lines.length) {
      if (origIdx >= originalLines.length) {
        result.push({ type: 'added', lineNum: newIdx + 1, content: lines[newIdx] });
        newIdx++;
      } else if (newIdx >= lines.length) {
        result.push({ type: 'removed', content: originalLines[origIdx] });
        origIdx++;
      } else if (lines[newIdx] === originalLines[origIdx]) {
        result.push({ type: 'same', lineNum: newIdx + 1, content: lines[newIdx] });
        origIdx++;
        newIdx++;
      } else {
        // Check if line was modified or added/removed
        const nextOrig = originalLines.indexOf(lines[newIdx], origIdx);
        const nextNew = lines.indexOf(originalLines[origIdx], newIdx);
        
        if (nextOrig === -1 && nextNew === -1) {
          // Both changed
          result.push({ type: 'removed', content: originalLines[origIdx] });
          result.push({ type: 'added', lineNum: newIdx + 1, content: lines[newIdx] });
          origIdx++;
          newIdx++;
        } else if (nextOrig !== -1 && (nextNew === -1 || nextOrig - origIdx <= nextNew - newIdx)) {
          // Lines were removed
          while (origIdx < nextOrig) {
            result.push({ type: 'removed', content: originalLines[origIdx] });
            origIdx++;
          }
        } else {
          // Lines were added
          while (newIdx < nextNew) {
            result.push({ type: 'added', lineNum: newIdx + 1, content: lines[newIdx] });
            newIdx++;
          }
        }
      }
    }
    
    return result;
  }, [lines, originalLines, originalContent, showDiff]);

  return (
    <div className="h-full flex flex-col rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: '#0d1117' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#21262d', backgroundColor: '#161b22' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{path}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{lang}</span>
          {originalContent && value !== originalContent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">modified</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {originalContent && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`p-1.5 rounded transition-colors ${showDiff ? 'bg-brand-500/20 text-brand-400' : 'hover:bg-slate-700 text-slate-400'}`}
              title="Toggle diff view"
            >
              <GitCompare size={14} />
            </button>
          )}
          <button onClick={handleCopy} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors" title="Copy">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors" title="Download">
            <Download size={14} />
          </button>
          {!readOnly && (
            <button onClick={handleSave} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors" title="Save">
              <Save size={14} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden relative">
        {showDiff && diffLines ? (
          // Diff view
          <div className="h-full overflow-auto font-mono text-xs">
            {diffLines.map((line, i) => (
              <div
                key={i}
                className={`flex ${
                  line.type === 'added' ? 'bg-emerald-500/10' :
                  line.type === 'removed' ? 'bg-red-500/10' : ''
                }`}
              >
                <div className="w-12 text-right pr-2 py-0.5 text-slate-600 select-none border-r" style={{ borderColor: '#21262d' }}>
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : line.lineNum || ''}
                </div>
                <pre className="flex-1 px-3 py-0.5 whitespace-pre-wrap">
                  <code
                    className={
                      line.type === 'added' ? 'text-emerald-300' :
                      line.type === 'removed' ? 'text-red-300 line-through' : 'text-slate-300'
                    }
                    dangerouslySetInnerHTML={{ __html: highlightLine(line.content, lang) }}
                  />
                </pre>
              </div>
            ))}
          </div>
        ) : (
          // Normal editor
          <div className="h-full flex">
            {/* Line numbers */}
            <div
              ref={lineNumbersRef}
              className="w-12 overflow-hidden text-right pr-2 py-3 text-slate-600 text-xs font-mono select-none border-r"
              style={{ borderColor: '#21262d', backgroundColor: '#0d1117' }}
            >
              {lines.map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
            
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onScroll={handleScroll}
              readOnly={readOnly}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-slate-300 font-mono text-xs leading-5 resize-none outline-none overflow-auto"
              style={{ tabSize: 2 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
