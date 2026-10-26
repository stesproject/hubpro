import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Plus,
  Trash2,
  FolderOpen,
  Image as ImageIcon,
  Zap,
  Sliders,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  Copy,
  ChevronDown,
  ChevronRight,
  Kanban,
} from 'lucide-react';
import {
  ActionIconName,
  ActionType,
  ButtonVariant,
  ConfiguredAction,
  Project,
  ProjectActionButton,
} from '../types/project';
import { GRADIENT_PRESETS } from '../data/defaultProjects';
import {
  pickFolderNative,
  pickImageNative,
  resolvePreviewImage,
} from '../services/bridge';
import { ACTION_ICON_OPTIONS, ActionIcon } from './ActionIcon';

interface ProjectConfigModalProps {
  project: Project | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onDuplicate?: (project: Project) => void;
}

const ACTION_TYPES: ActionType[] = [
  'open_ide',
  'open_folder',
  'open_app',
  'run_command',
  'open_url',
  'open_board',
];

const BUTTON_VARIANTS: {
  value: ButtonVariant;
  label: string;
  dot: string;
  previewClass: string;
}[] = [
  {
    value: 'primary',
    label: 'Indigo Primary',
    dot: 'bg-indigo-600',
    previewClass:
      'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
  {
    value: 'emerald',
    label: 'Emerald Green',
    dot: 'bg-emerald-500',
    previewClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  {
    value: 'amber',
    label: 'Amber Gold',
    dot: 'bg-amber-500',
    previewClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  {
    value: 'violet',
    label: 'Violet Purple',
    dot: 'bg-violet-600',
    previewClass:
      'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
  {
    value: 'secondary',
    label: 'Neutral Slate',
    dot: 'bg-slate-400',
    previewClass:
      'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700',
  },
];

const IDE_PRESETS = [
  'Antigravity',
  'Visual Studio Code',
  'Cursor',
  'Zed',
  'Xcode',
  'Godot',
];

const CONTROL_BASE_CLASS =
  'h-10 w-full px-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-700/90 text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors';

const LABEL_BASE_CLASS =
  'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5';

export const ProjectConfigModal: React.FC<ProjectConfigModalProps> = ({
  project,
  isNew,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'general' | 'click' | 'buttons'>(
    'general'
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const [draft, setDraft] = useState<Project>(() =>
    project
      ? JSON.parse(JSON.stringify(project))
      : {
          id: `proj-${Date.now()}`,
          name: '',
          tagline: '',
          category: 'Web',
          rootDirectory: '/Users/stef/Desktop/Dev/',
          previewImage: '',
          accentGradient: GRADIENT_PRESETS[0].value,
          pinned: false,
          primaryClickActions: [
            {
              id: `act-${Date.now()}-1`,
              type: 'open_ide',
              target: '',
              appName: 'Antigravity',
            },
          ],
          buttons: [
            {
              id: `btn-${Date.now()}-1`,
              label: 'Antigravity',
              icon: 'sparkles',
              variant: 'primary',
              action: {
                id: `b-act-${Date.now()}-1`,
                type: 'open_ide',
                target: '',
                appName: 'Antigravity',
              },
            },
            {
              id: `btn-${Date.now()}-2`,
              label: 'Start Dev',
              icon: 'terminal',
              variant: 'emerald',
              action: {
                id: `b-act-${Date.now()}-2`,
                type: 'run_command',
                target: 'npm run dev',
                runInTerminal: true,
              },
            },
            {
              id: `btn-${Date.now()}-3`,
              label: 'Open Folder',
              icon: 'folder',
              variant: 'secondary',
              action: {
                id: `b-act-${Date.now()}-3`,
                type: 'open_folder',
                target: '',
              },
            },
          ],
          todos: [],
          notes: '',
          updatedAt: new Date().toISOString(),
        }
  );

  // Track which button cards are expanded in the "Action Buttons" tab
  const [expandedButtonIds, setExpandedButtonIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (draft.buttons.length > 0) {
      initial.add(draft.buttons[0].id);
    }
    return initial;
  });

  useEffect(() => {
    let mounted = true;
    resolvePreviewImage(draft.previewImage).then((url) => {
      if (mounted) setPreviewDataUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, [draft.previewImage]);

  const toggleButtonExpanded = (id: string) => {
    setExpandedButtonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAllButtons = () => {
    setExpandedButtonIds(new Set(draft.buttons.map((b) => b.id)));
  };

  const collapseAllButtons = () => {
    setExpandedButtonIds(new Set());
  };

  const handleBrowseRootFolder = async () => {
    const picked = await pickFolderNative();
    if (picked) {
      setDraft((prev) => ({ ...prev, rootDirectory: picked }));
    }
  };

  const handleBrowsePreviewImage = async () => {
    const picked = await pickImageNative();
    if (picked) {
      setDraft((prev) => ({ ...prev, previewImage: picked }));
    }
  };

  const handleAddPrimaryAction = () => {
    const newAction: ConfiguredAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: 'open_ide',
      target: draft.rootDirectory || '',
      appName: 'Antigravity',
      runInTerminal: true,
    };
    setDraft((prev) => ({
      ...prev,
      primaryClickActions: [...prev.primaryClickActions, newAction],
    }));
  };

  const handleUpdatePrimaryAction = (
    index: number,
    updated: Partial<ConfiguredAction>
  ) => {
    setDraft((prev) => {
      const next = [...prev.primaryClickActions];
      next[index] = { ...next[index], ...updated };
      return { ...prev, primaryClickActions: next };
    });
  };

  const handleMovePrimaryAction = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draft.primaryClickActions.length) return;
    setDraft((prev) => {
      const next = [...prev.primaryClickActions];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return { ...prev, primaryClickActions: next };
    });
  };

  const handleRemovePrimaryAction = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      primaryClickActions: prev.primaryClickActions.filter((_, i) => i !== index),
    }));
  };

  const handleAddPresetButton = (
    preset: 'antigravity' | 'finder' | 'dev' | 'url'
  ) => {
    const id = `btn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const actId = `b-act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

    let newBtn: ProjectActionButton;
    if (preset === 'antigravity') {
      newBtn = {
        id,
        label: 'Antigravity',
        icon: 'sparkles',
        variant: 'primary',
        action: {
          id: actId,
          type: 'open_ide',
          target: draft.rootDirectory || '',
          appName: 'Antigravity',
        },
      };
    } else if (preset === 'finder') {
      newBtn = {
        id,
        label: 'Open Directory',
        icon: 'folder',
        variant: 'secondary',
        action: {
          id: actId,
          type: 'open_folder',
          target: draft.rootDirectory || '',
        },
      };
    } else if (preset === 'dev') {
      newBtn = {
        id,
        label: 'Start Dev',
        icon: 'terminal',
        variant: 'emerald',
        action: {
          id: actId,
          type: 'run_command',
          target: 'npm run dev',
          workingDir: draft.rootDirectory || '',
          runInTerminal: true,
        },
      };
    } else {
      newBtn = {
        id,
        label: 'Live Website',
        icon: 'globe',
        variant: 'violet',
        action: {
          id: actId,
          type: 'open_url',
          target: 'https://',
        },
      };
    }

    setDraft((prev) => ({
      ...prev,
      buttons: [...prev.buttons, newBtn],
    }));
    setExpandedButtonIds((prev) => new Set(prev).add(id));
  };

  const handleUpdateButton = (
    index: number,
    updated: Partial<ProjectActionButton>
  ) => {
    setDraft((prev) => {
      const next = [...prev.buttons];
      next[index] = { ...next[index], ...updated };
      return { ...prev, buttons: next };
    });
  };

  const handleUpdateButtonAction = (
    index: number,
    updated: Partial<ConfiguredAction>
  ) => {
    setDraft((prev) => {
      const next = [...prev.buttons];
      next[index] = {
        ...next[index],
        action: { ...next[index].action, ...updated },
      };
      return { ...prev, buttons: next };
    });
  };

  const handleMoveButton = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draft.buttons.length) return;
    setDraft((prev) => {
      const next = [...prev.buttons];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return { ...prev, buttons: next };
    });
  };

  const handleRemoveButton = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      name: draft.name.trim(),
      updatedAt: new Date().toISOString(),
    });
  };

  const formatActionSummaryLine = (act: ConfiguredAction) => {
    switch (act.type) {
      case 'open_ide':
        return `${act.appName || 'Antigravity'} → ${
          act.target || draft.rootDirectory || '...'
        }`;
      case 'open_folder':
        return `Finder → ${act.target || draft.rootDirectory || '...'}`;
      case 'open_app':
        return `App → ${act.target || '...'}`;
      case 'run_command':
        return `$ ${act.target || '...'}`;
      case 'open_url':
        return act.target || 'https://...';
      case 'open_board':
        return t('actionTypes.open_board');
    }
  };

  /**
   * Renders a clean, uniform-height (h-10) action configuration form.
   * All selects use `appearance-none` + custom ChevronDown so macOS WebKit
   * never shrinks dropdowns below input/button height.
   */
  const renderActionFields = (
    act: ConfiguredAction,
    onChange: (patch: Partial<ConfiguredAction>) => void
  ) => {
    return (
      <div className="space-y-3.5">
        {/* Row 1: Action Type + Secondary Option (IDE App or Terminal Mode) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className={LABEL_BASE_CLASS}>
              {t('modal.actionEditor.type')}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                <ActionIcon fallbackType={act.type} className="w-4 h-4" />
              </div>
              <select
                value={act.type}
                onChange={(e) =>
                  onChange({ type: e.target.value as ActionType })
                }
                className={`${CONTROL_BASE_CLASS} appearance-none pl-10 pr-9 cursor-pointer`}
              >
                {ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`actionTypes.${type}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {act.type === 'open_ide' && (
            <div>
              <label className={LABEL_BASE_CLASS}>
                {t('modal.actionEditor.ideApp')}
              </label>
              <input
                type="text"
                list="ide-presets-list"
                value={act.appName ?? 'Antigravity'}
                onChange={(e) => onChange({ appName: e.target.value })}
                placeholder={t('modal.actionEditor.ideAppPlaceholder')}
                className={CONTROL_BASE_CLASS}
              />
              <datalist id="ide-presets-list">
                {IDE_PRESETS.map((app) => (
                  <option key={app} value={app} />
                ))}
              </datalist>
            </div>
          )}

          {act.type === 'run_command' && (
            <div>
              <label className={LABEL_BASE_CLASS}>
                {t('modal.actionEditor.executionMode')}
              </label>
              <div className="relative">
                <select
                  value={(act.runInTerminal ?? true) ? 'terminal' : 'background'}
                  onChange={(e) =>
                    onChange({
                      runInTerminal: e.target.value === 'terminal',
                    })
                  }
                  className={`${CONTROL_BASE_CLASS} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="terminal">
                    {t('modal.actionEditor.runInTerminalWindow')}
                  </option>
                  <option value="background">
                    {t('modal.actionEditor.runInBackground')}
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Full-width Target Field (Directory, URL, or Command) */}
        {(act.type === 'open_ide' || act.type === 'open_folder' || act.type === 'open_app') && (
          <div>
            <label className={LABEL_BASE_CLASS}>
              {t('modal.actionEditor.targetFolder')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={act.target}
                onChange={(e) => onChange({ target: e.target.value })}
                placeholder={
                  draft.rootDirectory ||
                  t('modal.actionEditor.targetFolderPlaceholder')
                }
                className={`${CONTROL_BASE_CLASS} font-mono`}
              />
              <button
                type="button"
                onClick={async () => {
                  const folder = await pickFolderNative();
                  if (folder) onChange({ target: folder });
                }}
                className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('modal.fields.browseFolder')}</span>
              </button>
            </div>
          </div>
        )}

        {act.type === 'open_url' && (
          <div>
            <label className={LABEL_BASE_CLASS}>
              {t('modal.actionEditor.targetUrl')}
            </label>
            <input
              type="text"
              value={act.target}
              onChange={(e) => onChange({ target: e.target.value })}
              placeholder={t('modal.actionEditor.targetUrlPlaceholder')}
              className={`${CONTROL_BASE_CLASS} font-mono`}
            />
          </div>
        )}

        {act.type === 'run_command' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className={LABEL_BASE_CLASS}>
                {t('modal.actionEditor.targetCommand')}
              </label>
              <input
                type="text"
                value={act.target}
                onChange={(e) => onChange({ target: e.target.value })}
                placeholder={t('modal.actionEditor.targetCommandPlaceholder')}
                className={`${CONTROL_BASE_CLASS} font-mono`}
              />
            </div>

            <div>
              <label className={LABEL_BASE_CLASS}>
                {t('modal.actionEditor.workingDir')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={act.workingDir ?? ''}
                  onChange={(e) => onChange({ workingDir: e.target.value })}
                  placeholder={
                    draft.rootDirectory ||
                    t('modal.actionEditor.workingDirPlaceholder')
                  }
                  className={`${CONTROL_BASE_CLASS} font-mono`}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const folder = await pickFolderNative();
                    if (folder) onChange({ workingDir: folder });
                  }}
                  title={t('modal.fields.browseFolder')}
                  className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold inline-flex items-center justify-center shrink-0 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                </button>
              </div>
            </div>
          </div>
        )}

        {act.type === 'open_board' && (
          <div className="h-10 px-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
            <Kanban className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>{t('modal.actionEditor.boardInfo')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isNew
              ? t('modal.createTitle')
              : t('modal.editTitle', { name: draft.name || 'Project' })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200/70 dark:border-zinc-800 flex items-center gap-1 bg-slate-50/70 dark:bg-zinc-950/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('modal.tabs.general')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('click')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'click'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('modal.tabs.clickActions')}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {draft.primaryClickActions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'buttons'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('modal.tabs.buttons')}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {draft.buttons.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* TAB 1: GENERAL & PREVIEW */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={LABEL_BASE_CLASS}>
                    {t('modal.fields.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder={t('modal.fields.namePlaceholder')}
                    className={CONTROL_BASE_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_BASE_CLASS}>
                    {t('modal.fields.category')}
                  </label>
                  <input
                    type="text"
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder={t('modal.fields.categoryPlaceholder')}
                    className={CONTROL_BASE_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_BASE_CLASS}>
                  {t('modal.fields.tagline')}
                </label>
                <input
                  type="text"
                  value={draft.tagline}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, tagline: e.target.value }))
                  }
                  placeholder={t('modal.fields.taglinePlaceholder')}
                  className={CONTROL_BASE_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_BASE_CLASS}>
                  {t('modal.fields.rootDirectory')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft.rootDirectory}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        rootDirectory: e.target.value,
                      }))
                    }
                    placeholder={t('modal.fields.rootDirectoryPlaceholder')}
                    className={`${CONTROL_BASE_CLASS} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={handleBrowseRootFolder}
                    className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 inline-flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 text-indigo-500" />
                    <span>{t('modal.fields.browseFolder')}</span>
                  </button>
                </div>
              </div>

              {/* Preview Image Setting */}
              <div>
                <label className={LABEL_BASE_CLASS}>
                  {t('modal.fields.previewImage')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft.previewImage || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        previewImage: e.target.value,
                      }))
                    }
                    placeholder={t('modal.fields.previewImagePlaceholder')}
                    className={`${CONTROL_BASE_CLASS} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={handleBrowsePreviewImage}
                    className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 inline-flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>{t('modal.fields.browseImage')}</span>
                  </button>
                  {draft.previewImage && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, previewImage: '' }))
                      }
                      className="h-10 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold shrink-0"
                    >
                      {t('modal.fields.clearImage')}
                    </button>
                  )}
                </div>

                {previewDataUrl && (
                  <div className="mt-2.5 h-28 w-56 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 relative">
                    <img
                      src={previewDataUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Cover Gradient Theme Selector */}
              <div>
                <label className={LABEL_BASE_CLASS}>
                  {t('modal.fields.accentGradient')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          accentGradient: preset.value,
                        }))
                      }
                      className={`h-10 rounded-xl bg-gradient-to-br ${
                        preset.value
                      } px-3 flex items-center justify-between text-xs font-semibold text-white transition-all ${
                        draft.accentGradient === preset.value
                          ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900 scale-[1.01]'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pin Toggle */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.pinned)}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        pinned: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('modal.fields.pinned')}</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: CARD CLICK ACTIONS */}
          {activeTab === 'click' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                    {t('modal.clickActionsSection.title')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {t('modal.clickActionsSection.description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPrimaryAction}
                  className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('modal.clickActionsSection.addAction')}</span>
                </button>
              </div>

              {draft.primaryClickActions.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-400">
                  {t('modal.clickActionsSection.noActions')}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {draft.primaryClickActions.map((act, idx) => (
                    <div
                      key={act.id}
                      className="rounded-2xl bg-slate-50/70 dark:bg-zinc-950/50 border border-slate-200/90 dark:border-zinc-800 overflow-hidden"
                    >
                      {/* Step Header Bar */}
                      <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-zinc-900 border-b border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shrink-0">
                            <Zap className="w-3 h-3" />
                            {t('modal.clickActionsSection.actionIndex', {
                              index: idx + 1,
                            })}
                          </span>
                          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 truncate">
                            {formatActionSummaryLine(act)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMovePrimaryAction(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePrimaryAction(idx, 1)}
                            disabled={
                              idx === draft.primaryClickActions.length - 1
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePrimaryAction(idx)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-500/10 text-xs text-rose-500 hover:text-rose-600 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('modal.actionEditor.remove')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Step Fields Body */}
                      <div className="p-4">
                        {renderActionFields(act, (patch) =>
                          handleUpdatePrimaryAction(idx, patch)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONFIGURABLE ACTION BUTTONS */}
          {activeTab === 'buttons' && (
            <div className="space-y-4">
              {/* Top Info & Preset Bar */}
              <div className="bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                      {t('modal.buttonsSection.title')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {t('modal.buttonsSection.description')}
                    </p>
                  </div>

                  {draft.buttons.length > 1 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={expandAllButtons}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800"
                      >
                        {t('modal.buttonsSection.expandAll')}
                      </button>
                      <span className="text-slate-300 dark:text-zinc-700">
                        •
                      </span>
                      <button
                        type="button"
                        onClick={collapseAllButtons}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-200/70 dark:hover:bg-zinc-800"
                      >
                        {t('modal.buttonsSection.collapseAll')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Preset Adders */}
                <div className="flex items-center flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddPresetButton('antigravity')}
                    className="h-9 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-semibold transition-colors"
                  >
                    {t('modal.buttonsSection.addPresetAntigravity')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetButton('dev')}
                    className="h-9 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-semibold transition-colors"
                  >
                    {t('modal.buttonsSection.addPresetDevServer')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetButton('finder')}
                    className="h-9 px-3 rounded-xl bg-slate-200/70 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    {t('modal.buttonsSection.addPresetFinder')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetButton('url')}
                    className="h-9 px-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-semibold transition-colors"
                  >
                    {t('modal.buttonsSection.addPresetUrl')}
                  </button>
                </div>
              </div>

              {/* List of Collapsible Button Cards */}
              <div className="space-y-3">
                {draft.buttons.map((btn, idx) => {
                  const isExpanded = expandedButtonIds.has(btn.id);
                  const variantMeta =
                    BUTTON_VARIANTS.find((v) => v.value === btn.variant) ||
                    BUTTON_VARIANTS[4];

                  return (
                    <div
                      key={btn.id}
                      className="rounded-2xl bg-slate-50/70 dark:bg-zinc-950/50 border border-slate-200/90 dark:border-zinc-800 overflow-hidden transition-all"
                    >
                      {/* Collapsible Header Bar with Live Button Preview */}
                      <div
                        onClick={() => toggleButtonExpanded(btn.id)}
                        className="px-4 py-3 bg-slate-100/70 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between gap-3 select-none transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-slate-400 dark:text-zinc-500">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>

                          {/* Live Preview Pill */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shrink-0 ${variantMeta.previewClass}`}
                          >
                            <ActionIcon
                              name={btn.icon}
                              fallbackType={btn.action.type}
                              className="w-3.5 h-3.5"
                            />
                            <span>{btn.label || 'Untitled'}</span>
                          </span>

                          {/* Target Summary */}
                          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 truncate">
                            {formatActionSummaryLine(btn.action)}
                          </span>
                        </div>

                        {/* Reorder & Remove Controls */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 shrink-0"
                        >
                          <button
                            type="button"
                            onClick={() => handleMoveButton(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveButton(idx, 1)}
                            disabled={idx === draft.buttons.length - 1}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveButton(idx)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Configuration Body */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200/70 dark:border-zinc-800 space-y-4">
                          {/* Appearance Row: 3 equal columns, all h-10 */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pb-4 border-b border-slate-200/60 dark:border-zinc-800/80">
                            {/* 1. Button Label */}
                            <div>
                              <label className={LABEL_BASE_CLASS}>
                                {t('modal.buttonsSection.buttonLabel')}
                              </label>
                              <input
                                type="text"
                                value={btn.label}
                                onChange={(e) =>
                                  handleUpdateButton(idx, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder={t(
                                  'modal.buttonsSection.buttonLabelPlaceholder'
                                )}
                                className={CONTROL_BASE_CLASS}
                              />
                            </div>

                            {/* 2. Button Icon (h-10 custom select with icon inside) */}
                            <div>
                              <label className={LABEL_BASE_CLASS}>
                                {t('modal.buttonsSection.buttonIcon')}
                              </label>
                              <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                                  <ActionIcon
                                    name={btn.icon}
                                    className="w-4 h-4"
                                  />
                                </div>
                                <select
                                  value={btn.icon}
                                  onChange={(e) =>
                                    handleUpdateButton(idx, {
                                      icon: e.target.value as ActionIconName,
                                    })
                                  }
                                  className={`${CONTROL_BASE_CLASS} appearance-none pl-10 pr-9 cursor-pointer`}
                                >
                                  {ACTION_ICON_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                              </div>
                            </div>

                            {/* 3. Button Color Style (h-10 custom select with color dot inside) */}
                            <div>
                              <label className={LABEL_BASE_CLASS}>
                                {t('modal.buttonsSection.buttonColor')}
                              </label>
                              <div className="relative">
                                <span
                                  className={`w-3 h-3 rounded-full absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${variantMeta.dot}`}
                                />
                                <select
                                  value={btn.variant}
                                  onChange={(e) =>
                                    handleUpdateButton(idx, {
                                      variant: e.target.value as ButtonVariant,
                                    })
                                  }
                                  className={`${CONTROL_BASE_CLASS} appearance-none pl-9 pr-9 cursor-pointer`}
                                >
                                  {BUTTON_VARIANTS.map((v) => (
                                    <option key={v.value} value={v.value}>
                                      {v.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                              </div>
                            </div>
                          </div>

                          {/* Action Parameters for this Button */}
                          {renderActionFields(btn.action, (patch) =>
                            handleUpdateButtonAction(idx, patch)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {!isNew && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDelete) {
                      onDelete(draft.id);
                    } else {
                      setConfirmDelete(true);
                    }
                  }}
                  className={`h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold transition-colors ${
                    confirmDelete
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {confirmDelete
                      ? t('modal.footer.confirmDelete')
                      : t('modal.footer.deleteProject')}
                  </span>
                </button>
              )}

              {!isNew && onDuplicate && (
                <button
                  type="button"
                  onClick={() => onDuplicate(draft)}
                  className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('modal.footer.duplicateProject')}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
              >
                {t('modal.footer.cancel')}
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {isNew ? t('modal.footer.create') : t('modal.footer.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
