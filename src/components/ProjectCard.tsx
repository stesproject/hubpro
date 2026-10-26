import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Play,
  Pin,
  Settings2,
  Zap,
  FolderGit2,
  Sparkles,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  ButtonVariant,
  ConfiguredAction,
  Project,
  ProjectActionButton,
} from '../types/project';
import { resolvePreviewImage } from '../services/bridge';
import { ActionIcon } from './ActionIcon';

interface ProjectCardProps {
  project: Project;
  onCardClick: (project: Project) => void;
  onButtonClick: (button: ProjectActionButton, project: Project) => void;
  onOpenBoard: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onTogglePin: (project: Project) => void;
  onQuickToggleTodo: (projectId: string, todoId: string) => void;
}

const BUTTON_VARIANT_POPOVER: Record<
  ButtonVariant,
  {
    container: string;
    iconBox: string;
  }
> = {
  primary: {
    container:
      'bg-indigo-50/80 hover:bg-indigo-600 text-indigo-900 hover:text-white dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-600 dark:hover:text-white border-indigo-200/70 dark:border-indigo-800/60 hover:border-indigo-600',
    iconBox:
      'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 group-hover/btn:bg-white/20 group-hover/btn:text-white',
  },
  emerald: {
    container:
      'bg-emerald-50/80 hover:bg-emerald-600 text-emerald-900 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-600 dark:hover:text-white border-emerald-200/70 dark:border-emerald-800/60 hover:border-emerald-600',
    iconBox:
      'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 group-hover/btn:bg-white/20 group-hover/btn:text-white',
  },
  amber: {
    container:
      'bg-amber-50/80 hover:bg-amber-500 text-amber-900 hover:text-white dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-500 dark:hover:text-white border-amber-200/70 dark:border-amber-800/60 hover:border-amber-500',
    iconBox:
      'bg-amber-600/10 text-amber-600 dark:text-amber-400 group-hover/btn:bg-white/20 group-hover/btn:text-white',
  },
  violet: {
    container:
      'bg-violet-50/80 hover:bg-violet-600 text-violet-900 hover:text-white dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-600 dark:hover:text-white border-violet-200/70 dark:border-violet-800/60 hover:border-violet-600',
    iconBox:
      'bg-violet-600/10 text-violet-600 dark:text-violet-400 group-hover/btn:bg-white/20 group-hover/btn:text-white',
  },
  secondary: {
    container:
      'bg-slate-100/90 hover:bg-slate-800 text-slate-800 hover:text-white dark:bg-zinc-800/70 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:text-white border-slate-200/80 dark:border-zinc-700 hover:border-slate-800',
    iconBox:
      'bg-slate-200/70 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300 group-hover/btn:bg-white/20 group-hover/btn:text-white',
  },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onCardClick,
  onButtonClick,
  onOpenBoard,
  onEditProject,
  onTogglePin,
  onQuickToggleTodo,
}) => {
  const { t } = useTranslation();
  const [resolvedImg, setResolvedImg] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const hoverTimerRef = useRef<number | null>(null);
  const leaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    resolvePreviewImage(project.previewImage).then((url) => {
      if (mounted) setResolvedImg(url);
    });
    return () => {
      mounted = false;
    };
  }, [project.previewImage]);

  // Clean, non-intrusive hover triggers
  const handleTriggerMouseEnter = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setIsPopupOpen(true);
    }, 100);
  };

  const handleTriggerMouseLeave = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    leaveTimerRef.current = window.setTimeout(() => {
      setIsPopupOpen(false);
    }, 220);
  };

  const handlePopupMouseEnter = () => {
    if (leaveTimerRef.current !== null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handlePopupMouseLeave = () => {
    leaveTimerRef.current = window.setTimeout(() => {
      setIsPopupOpen(false);
    }, 200);
  };

  const totalTodos = project.todos.length;
  const completedTodos = project.todos.filter((td) => td.completed).length;
  const progressPercent =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
  const pendingTodos = project.todos.filter((td) => !td.completed).slice(0, 2);

  const formatActionSummary = (act: ConfiguredAction) => {
    if (act.label) return act.label;
    switch (act.type) {
      case 'open_ide':
        return `${act.appName || 'Antigravity'}`;
      case 'open_folder':
        return t('actionTypes.open_folder');
      case 'open_document':
        return t('actionTypes.open_document', { defaultValue: 'Open Document' });
      case 'open_app':
        return t('actionTypes.open_app');
      case 'run_command':
        return act.target;
      case 'open_url':
        return act.target;
      case 'open_board':
        return t('card.openBoard');
    }
  };

  const formatTargetHint = (act: ConfiguredAction) => {
    switch (act.type) {
      case 'open_ide':
        return act.appName || 'Antigravity';
      case 'open_folder':
        return 'Finder';
      case 'open_document': {
        const parts = act.target.split('/');
        return parts[parts.length - 1] || 'Document';
      }
      case 'open_app':
        return 'App';
      case 'run_command':
        return act.target;
      case 'open_url':
        try {
          const url = new URL(
            act.target.startsWith('http') ? act.target : `https://${act.target}`
          );
          return url.hostname.replace(/^www\./, '');
        } catch {
          return act.target;
        }
      case 'open_board':
        return 'Board';
      default:
        return '';
    }
  };

  const playTooltip =
    project.primaryClickActions.length === 1
      ? t('card.clickHintSingle', {
          label: formatActionSummary(project.primaryClickActions[0]),
        })
      : project.primaryClickActions.length > 1
        ? t('card.clickHint', { count: project.primaryClickActions.length })
        : t('card.runPrimaryActions');

  return (
    <div
      onClick={() => onOpenBoard(project)}
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/90 shadow-sm hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-[border-color,box-shadow,background-color] duration-200 cursor-pointer ${
        isPopupOpen ? 'z-30' : 'hover:z-10'
      }`}
    >
      {/* Top Preview Cover + Clickable Main Trigger */}
      <div
        title={t('card.openBoard')}
        className="relative h-36 w-full overflow-hidden rounded-t-2xl select-none"
      >
        {resolvedImg ? (
          <img
            src={resolvedImg}
            alt={project.name}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${
              project.accentGradient ||
              'from-indigo-600 via-violet-600 to-purple-700'
            } flex items-center justify-center relative`}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.35) 0%, transparent 50%)',
              }}
            />
            <FolderGit2 className="w-12 h-12 text-white/25 group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}

        {/* Dark gradient overlay for legible badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/15" />

        {/* Top Bar: Category & Quick Control Icons */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {project.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-black/45 text-white backdrop-blur-md border border-white/15">
                {project.category}
              </span>
            )}
            {project.primaryClickActions.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/80 text-white backdrop-blur-md">
                <Zap className="w-2.5 h-2.5" />
                {project.primaryClickActions.length === 1
                  ? formatActionSummary(project.primaryClickActions[0])
                  : t('card.primaryActionsBadge', {
                      count: project.primaryClickActions.length,
                    })}
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onTogglePin(project)}
              title={t('card.pinProject')}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-colors ${
                project.pinned
                  ? 'bg-amber-500/90 text-white shadow-sm'
                  : 'bg-black/40 text-white/75 hover:bg-black/65 hover:text-white'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEditProject(project)}
              title={t('card.editProject')}
              className="p-1.5 rounded-lg bg-black/40 text-white/85 hover:bg-black/70 hover:text-white backdrop-blur-md transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom of Cover: Project Title & Tagline */}
        <div className="absolute bottom-3 left-3.5 right-3.5">
          <h3 className="text-lg font-bold text-white tracking-tight leading-snug truncate drop-shadow-sm group-hover:text-indigo-200 transition-colors">
            {project.name}
          </h3>
          {project.tagline && (
            <p className="text-xs text-white/80 truncate mt-0.5">
              {project.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Middle Section: At-a-glance To-Do Progress & Pending Tasks Preview */}
      <div className="px-4 pt-3 pb-2.5 border-b border-slate-100 dark:border-zinc-800/80 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCardClick(project);
              }}
              title={playTooltip}
              aria-label={t('card.runPrimaryActions')}
              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white transition-colors active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>

            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-indigo-500">
              {totalTodos === 0
                ? t('card.noTasksYet')
                : completedTodos === totalTodos
                  ? t('card.allTasksDone', { total: totalTodos })
                  : t('card.tasksProgress', {
                      completed: completedTodos,
                      total: totalTodos,
                    })}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden mb-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent === 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Up to 2 pending tasks right on the card for immediate overview */}
          {pendingTodos.length > 0 ? (
            <div className="space-y-1 my-1">
              {pendingTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-2 group/todo text-xs py-0.5"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickToggleTodo(project.id, todo.id);
                    }}
                    title={t('board.markCompleted')}
                    className="mt-0.5 text-slate-400 hover:text-emerald-500 dark:text-zinc-500 dark:hover:text-emerald-400 transition-colors shrink-0"
                  >
                    <Circle className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-600 dark:text-zinc-300 truncate hover:text-slate-900 dark:hover:text-white">
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
          ) : totalTodos > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {t('card.allTasksDone', { total: totalTodos })}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Section: Actions Button + Floating Non-Intrusive Popover */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="p-3 bg-slate-50/70 dark:bg-zinc-950/40 rounded-b-2xl relative cursor-default"
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
      >
        {project.buttons.length > 0 ? (
          <div className="relative">
            {/* Actions Trigger Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPopupOpen((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-indigo-50/80 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 hover:border-indigo-500/50 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all select-none group/trigger"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover/trigger:scale-110 transition-transform" />
                <span>
                  {t('card.viewActionsPopup', { count: project.buttons.length })}
                </span>
              </div>
              <ChevronUp
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isPopupOpen ? 'rotate-180 text-indigo-500' : ''
                }`}
              />
            </button>

            {/* Non-Intrusive Floating Popup (Popping up directly above the trigger) */}
            {isPopupOpen && (
              <div
                onMouseEnter={handlePopupMouseEnter}
                onMouseLeave={handlePopupMouseLeave}
                className="absolute bottom-[calc(100%+8px)] left-[-4px] right-[-4px] z-50 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-zinc-700/90 shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 overflow-hidden animate-fadeIn"
              >
                {/* Popup Header */}
                <div className="px-3.5 py-2 bg-slate-50/90 dark:bg-zinc-950/70 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      {t('card.actionsPopupTitle')}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                      {project.buttons.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {project.primaryClickActions.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPopupOpen(false);
                          onCardClick(project);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-sm transition-colors"
                      >
                        <Zap className="w-2.5 h-2.5" />
                        <span>{t('card.quickLaunch')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsPopupOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Actions Grid (2-column layout for projects with > 4 actions) */}
                <div
                  className={`p-2 max-h-72 overflow-y-auto ${
                    project.buttons.length > 4
                      ? 'grid grid-cols-2 gap-1.5'
                      : 'grid grid-cols-1 gap-1.5'
                  }`}
                >
                  {project.buttons.map((btn) => {
                    const styleMeta =
                      BUTTON_VARIANT_POPOVER[btn.variant || 'secondary'];

                    return (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPopupOpen(false);
                          onButtonClick(btn, project);
                        }}
                        className={`group/btn flex items-center justify-between p-2 rounded-xl text-left border transition-all active:scale-[0.98] ${styleMeta.container}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`p-1.5 rounded-lg shrink-0 transition-all ${styleMeta.iconBox}`}
                          >
                            <ActionIcon
                              name={btn.icon}
                              fallbackType={btn.action.type}
                              className="w-3.5 h-3.5"
                            />
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate leading-tight">
                              {btn.label}
                            </div>
                            <div className="text-[10px] font-mono opacity-60 truncate mt-0.5">
                              {formatTargetHint(btn.action)}
                            </div>
                          </div>
                        </div>

                        <ExternalLink className="w-3 h-3 opacity-30 group-hover/btn:opacity-100 shrink-0 ml-1.5 transition-opacity" />
                      </button>
                    );
                  })}
                </div>

                {/* Popup Footer */}
                <div className="px-3 py-1.5 bg-slate-50/70 dark:bg-zinc-950/50 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPopupOpen(false);
                      onEditProject(project);
                    }}
                    className="hover:text-indigo-500 transition-colors"
                  >
                    + {t('card.editProject')}
                  </button>
                  <span className="text-[10px]">
                    {project.buttons.length} actions ready
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 py-0.5">
            <span>{t('card.noButtonsConfigured')}</span>
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="text-indigo-500 hover:underline font-medium"
            >
              + {t('card.editProject')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
