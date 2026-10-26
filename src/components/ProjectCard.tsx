import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Kanban,
  Pin,
  Settings2,
  Zap,
  FolderGit2,
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

const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600/10 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white dark:hover:text-white border-indigo-500/25 hover:border-indigo-600',
  emerald:
    'bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-white border-emerald-500/25 hover:border-emerald-600',
  amber:
    'bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white dark:hover:text-white border-amber-500/25 hover:border-amber-500',
  violet:
    'bg-violet-500/10 hover:bg-violet-600 text-violet-700 dark:text-violet-300 hover:text-white dark:hover:text-white border-violet-500/25 hover:border-violet-600',
  secondary:
    'bg-slate-100 hover:bg-slate-200/90 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border-slate-200/80 dark:border-zinc-700/80',
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

  useEffect(() => {
    let mounted = true;
    resolvePreviewImage(project.previewImage).then((url) => {
      if (mounted) setResolvedImg(url);
    });
    return () => {
      mounted = false;
    };
  }, [project.previewImage]);

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

  const clickTooltip =
    project.primaryClickActions.length === 1
      ? t('card.clickHintSingle', {
          label: formatActionSummary(project.primaryClickActions[0]),
        })
      : project.primaryClickActions.length > 1
        ? t('card.clickHint', { count: project.primaryClickActions.length })
        : t('card.openBoard');

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/90 shadow-sm hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 overflow-hidden">
      {/* Top Preview Cover + Clickable Main Trigger */}
      <div
        onClick={() => onCardClick(project)}
        title={clickTooltip}
        className="relative h-36 w-full cursor-pointer overflow-hidden select-none"
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
              project.accentGradient || 'from-indigo-600 via-violet-600 to-purple-700'
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
              onClick={() => onOpenBoard(project)}
              title={t('card.openBoard')}
              className="p-1.5 rounded-lg bg-black/40 text-white/85 hover:bg-indigo-600 hover:text-white backdrop-blur-md transition-colors"
            >
              <Kanban className="w-3.5 h-3.5" />
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
              onClick={() => onOpenBoard(project)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Kanban className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('card.openBoard')}</span>
            </button>

            <span
              onClick={() => onOpenBoard(project)}
              className="cursor-pointer text-[11px] font-medium text-slate-500 dark:text-zinc-400 hover:text-indigo-500"
            >
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
          <div
            onClick={() => onOpenBoard(project)}
            className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden cursor-pointer mb-2.5"
          >
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
                  <span
                    onClick={() => onOpenBoard(project)}
                    className="text-slate-600 dark:text-zinc-300 truncate cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    {todo.title}
                  </span>
                </div>
              ))}
            </div>
          ) : totalTodos > 0 ? (
            <div
              onClick={() => onOpenBoard(project)}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 py-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {t('card.allTasksDone', { total: totalTodos })}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Section: Configurable Action Buttons */}
      <div className="p-3 bg-slate-50/60 dark:bg-zinc-950/40">
        {project.buttons.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {project.buttons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onButtonClick(btn, project);
                }}
                title={`${btn.label} → ${btn.action.target || project.rootDirectory}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 active:scale-95 ${
                  BUTTON_VARIANT_STYLES[btn.variant || 'secondary']
                }`}
              >
                <ActionIcon
                  name={btn.icon}
                  fallbackType={btn.action.type}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span className="truncate max-w-[130px]">{btn.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
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
