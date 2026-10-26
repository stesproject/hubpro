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
  ChevronDown,
  Sparkles,
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

const BUTTON_VARIANT_BADGES: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 group-hover/item:bg-indigo-600 group-hover/item:text-white',
  emerald:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover/item:bg-emerald-600 group-hover/item:text-white',
  amber:
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover/item:bg-amber-500 group-hover/item:text-white',
  violet:
    'bg-violet-500/15 text-violet-600 dark:text-violet-400 group-hover/item:bg-violet-600 group-hover/item:text-white',
  secondary:
    'bg-slate-500/15 text-slate-600 dark:text-zinc-400 group-hover/item:bg-slate-700 group-hover/item:text-white dark:group-hover/item:bg-zinc-600',
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
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const leaveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    resolvePreviewImage(project.previewImage).then((url) => {
      if (mounted) setResolvedImg(url);
    });
    return () => {
      mounted = false;
    };
  }, [project.previewImage]);

  const handleActionsMouseEnter = () => {
    if (leaveTimeoutRef.current !== null) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsActionsOpen(true);
  };

  const handleActionsMouseLeave = () => {
    leaveTimeoutRef.current = window.setTimeout(() => {
      setIsActionsOpen(false);
    }, 150);
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
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/90 shadow-sm hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 cursor-pointer ${
        isActionsOpen ? 'z-40' : 'hover:z-20'
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
            {/* Subtle decorative mesh */}
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

      {/* Bottom Section: Dropdown for Action Buttons (Shown on Hover) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="p-3 bg-slate-50/70 dark:bg-zinc-950/40 rounded-b-2xl relative cursor-default"
        onMouseEnter={handleActionsMouseEnter}
        onMouseLeave={handleActionsMouseLeave}
      >
        {project.buttons.length > 0 ? (
          <div className="relative">
            {/* Actions Trigger Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsActionsOpen((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 hover:border-indigo-500/40 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-sm transition-all select-none"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{t('card.actionsDropdownTitle')}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {project.buttons.length}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isActionsOpen ? 'rotate-180 text-indigo-500' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu List (Revealed on Hover) */}
            {isActionsOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 shadow-2xl overflow-hidden animate-fadeIn"
              >
                {/* Dropdown Header */}
                <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  <span>
                    {t('card.actionsDropdownCount', {
                      count: project.buttons.length,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsOpen(false);
                      onEditProject(project);
                    }}
                    className="text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {t('card.editProject')}
                  </button>
                </div>

                {/* Scrollable Actions List */}
                <div className="p-1.5 max-h-64 sm:max-h-72 overflow-y-auto space-y-0.5">
                  {project.buttons.map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsActionsOpen(false);
                        onButtonClick(btn, project);
                      }}
                      title={`${btn.label} → ${
                        btn.action.target || project.rootDirectory
                      }`}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/90 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors group/item text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                            BUTTON_VARIANT_BADGES[btn.variant || 'secondary']
                          }`}
                        >
                          <ActionIcon
                            name={btn.icon}
                            fallbackType={btn.action.type}
                            className="w-3.5 h-3.5"
                          />
                        </span>
                        <span className="font-semibold truncate">
                          {btn.label}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate max-w-[130px] ml-2 shrink-0 opacity-75 group-hover/item:opacity-100 group-hover/item:text-indigo-500">
                        {formatTargetHint(btn.action)}
                      </span>
                    </button>
                  ))}
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
