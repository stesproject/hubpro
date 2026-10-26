import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Search,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { marked } from 'marked';
import katex from 'katex';
import { ConfiguredAction, Project } from '../types/project';
import { readDocumentFile } from '../services/bridge';

interface DocumentViewerModalProps {
  isOpen: boolean;
  action: ConfiguredAction | null;
  project: Project | null;
  onClose: () => void;
  onOpenExternally: (action: ConfiguredAction, project: Project) => void;
}

function renderMathInMarkdown(markdown: string): string {
  const mathPlaceholders: string[] = [];

  // 1. Replace display math ($$ ... $$)
  let processed = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      const placeholder = `<!--KATEX_BLOCK_${mathPlaceholders.length}-->`;
      mathPlaceholders.push(rendered);
      return `\n\n${placeholder}\n\n`;
    } catch {
      return `$$${math}$$`;
    }
  });

  // 2. Replace inline math ($ ... $) - avoiding escaped \$ or double $$
  processed = processed.replace(/(^|[^\\])\$([^\n$]+?)\$/g, (match, prefix, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      const placeholder = `<!--KATEX_INLINE_${mathPlaceholders.length}-->`;
      mathPlaceholders.push(rendered);
      return `${prefix}${placeholder}`;
    } catch {
      return match;
    }
  });

  // 3. Render markdown through marked
  let html = marked.parse(processed, {
    gfm: true,
    breaks: true,
  }) as string;

  // 4. Restore KaTeX blocks
  mathPlaceholders.forEach((katexHtml, index) => {
    const blockRegex = new RegExp(`<p>\\s*<!--KATEX_BLOCK_${index}-->\\s*<\\/p>|<!--KATEX_BLOCK_${index}-->`, 'g');
    html = html.replace(blockRegex, katexHtml);

    const inlineRegex = new RegExp(`<!--KATEX_INLINE_${index}-->`, 'g');
    html = html.replace(inlineRegex, katexHtml);
  });

  return html;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  action,
  project,
  onClose,
  onOpenExternally,
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const documentPath = useMemo(() => {
    if (!action) return '';
    let target = action.target.trim();
    if (!target && project) {
      target = project.rootDirectory;
    }
    return target;
  }, [action, project]);

  const documentTitle = useMemo(() => {
    if (action?.label?.trim()) return action.label.trim();
    if (!documentPath) return t('documentViewer.title', { defaultValue: 'Document Viewer' });
    const parts = documentPath.split('/');
    return parts[parts.length - 1] || 'Document';
  }, [action, documentPath, t]);

  useEffect(() => {
    if (!isOpen || !documentPath) {
      setContent('');
      setError(null);
      setSearchQuery('');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    readDocumentFile(documentPath)
      .then((rawText) => {
        if (!isMounted) return;
        setContent(rawText);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(String(err));
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, documentPath]);

  // Keyboard navigation: Escape closes modal, Cmd+F focuses search
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const renderedHtml = useMemo(() => {
    if (!content) return '';
    return renderMathInMarkdown(content);
  }, [content]);

  const handleCopyPath = () => {
    if (!documentPath) return;
    navigator.clipboard.writeText(documentPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternally = () => {
    if (action && project) {
      onOpenExternally(action, project);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[92vh] max-h-[950px] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {documentTitle}
                </h2>
                {project && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    {project.name}
                  </span>
                )}
              </div>
              <p
                onClick={handleCopyPath}
                title={t('documentViewer.copyPathHint', { defaultValue: 'Click to copy full path' })}
                className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 truncate cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors mt-0.5"
              >
                {documentPath}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick in-document search filter */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('documentViewer.searchPlaceholder', { defaultValue: 'Search (⌘F)...' })}
                className="h-8 pl-8 pr-3 text-xs rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-zinc-200 w-36 lg:w-48 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyPath}
              title={t('documentViewer.copyPath', { defaultValue: 'Copy document path' })}
              className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">{t('documentViewer.copied', { defaultValue: 'Copied' })}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('documentViewer.copy', { defaultValue: 'Copy Path' })}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenExternally}
              title={t('documentViewer.openExternalTooltip', { defaultValue: 'Open in system default application' })}
              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {action?.appName ? action.appName : t('documentViewer.openExternal', { defaultValue: 'Open with App' })}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title={t('modal.footer.cancel', { defaultValue: 'Close' })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Document Content */}
        <div
          ref={contentContainerRef}
          className="flex-1 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 selection:bg-indigo-500 selection:text-white"
        >
          {loading && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('documentViewer.loading', { defaultValue: 'Loading document...' })}
              </p>
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {t('documentViewer.errorTitle', { defaultValue: 'Could not load document preview' })}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={handleOpenExternally}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span>{t('documentViewer.tryOpeningExternally', { defaultValue: 'Open in External Application' })}</span>
              </button>
            </div>
          )}

          {!loading && !error && (
            <div
              className="hubpro-doc-content max-w-4xl mx-auto"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
