import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Settings2,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
  StickyNote,
  FolderOpen,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  ButtonVariant,
  ConfiguredAction,
  Project,
  ProjectActionButton,
  TodoCard,
  TodoColumnId,
} from '../types/project';
import { ActionIcon } from './ActionIcon';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface ProjectBoardViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updated: Project) => void;
  onEditProject: (project: Project) => void;
  onRunPrimaryActions: (project: Project) => void;
  onRunButtonAction: (btn: ProjectActionButton, project: Project) => void;
  onRunSingleAction: (action: ConfiguredAction, project: Project) => void;
}

const COLUMNS: { id: TodoColumnId; accentClass: string; dotClass: string }[] = [
  {
    id: 'todo',
    accentClass: 'border-t-amber-500',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'in_progress',
    accentClass: 'border-t-indigo-500',
    dotClass: 'bg-indigo-500',
  },
  {
    id: 'done',
    accentClass: 'border-t-emerald-500',
    dotClass: 'bg-emerald-500',
  },
];

const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-sm',
  emerald:
    'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm',
  amber:
    'bg-amber-500 hover:bg-amber-400 text-white border-amber-400 shadow-sm',
  violet:
    'bg-violet-600 hover:bg-violet-500 text-white border-violet-500 shadow-sm',
  secondary:
    'bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-700',
};

export const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  onEditProject,
  onRunPrimaryActions,
  onRunButtonAction,
  onRunSingleAction,
}) => {
  const { t } = useTranslation();
  const [cardFilter, setCardFilter] = useState('');
  const [addingToColumn, setAddingToColumn] = useState<TodoColumnId | null>('todo');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TodoColumnId | null>(null);

  const totalTodos = project.todos.length;
  const completedTodos = project.todos.filter((td) => td.completed).length;
  const percent = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const handleAddCard = (column: TodoColumnId) => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    const newCard: TodoCard = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmedTitle,
      description: newDesc.trim(),
      completed: column === 'done',
      column,
      createdAt: new Date().toISOString(),
    };

    onUpdateProject({
      ...project,
      todos: [newCard, ...project.todos],
      updatedAt: new Date().toISOString(),
    });

    setNewTitle('');
    setNewDesc('');
  };

  const handleToggleCompleted = (cardId: string) => {
    const updatedTodos = project.todos.map((td) => {
      if (td.id !== cardId) return td;
      const nextCompleted = !td.completed;
      return {
        ...td,
        completed: nextCompleted,
        column: nextCompleted
          ? ('done' as TodoColumnId)
          : td.column === 'done'
            ? ('todo' as TodoColumnId)
            : td.column,
      };
    });

    onUpdateProject({
      ...project,
      todos: updatedTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateCardField = (
    cardId: string,
    field: 'title' | 'description',
    value: string
  ) => {
    const updatedTodos = project.todos.map((td) =>
      td.id === cardId ? { ...td, [field]: value } : td
    );
    onUpdateProject({
      ...project,
      todos: updatedTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMoveCardColumn = (cardId: string, targetColumn: TodoColumnId) => {
    const updatedTodos = project.todos.map((td) => {
      if (td.id !== cardId) return td;
      return {
        ...td,
        column: targetColumn,
        completed: targetColumn === 'done' ? true : false,
      };
    });
    onUpdateProject({
      ...project,
      todos: updatedTodos,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteCard = (cardId: string) => {
    onUpdateProject({
      ...project,
      todos: project.todos.filter((td) => td.id !== cardId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleNotesChange = (notes: string) => {
    onUpdateProject({
      ...project,
      notes,
      updatedAt: new Date().toISOString(),
    });
  };

  const filteredTodos = project.todos.filter((td) => {
    if (!cardFilter.trim()) return true;
    const q = cardFilter.toLowerCase();
    return (
      td.title.toLowerCase().includes(q) ||
      td.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Project Header Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('board.backToHub')}</span>
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {project.name}
                </h1>
                {project.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {project.category}
                  </span>
                )}
              </div>
              {project.tagline && (
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  {project.tagline}
                </p>
              )}
              {project.rootDirectory && (
                <p className="text-xs font-mono text-slate-400 dark:text-zinc-500 mt-1">
                  {project.rootDirectory}
                </p>
              )}
            </div>
          </div>

          {/* Right Controls: Launch Primary Actions & Configure */}
          <div className="flex items-center flex-wrap gap-2">
            {project.primaryClickActions.length > 0 && (
              <button
                type="button"
                onClick={() => onRunPrimaryActions(project)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {t('board.runCardClickActions', {
                    count: project.primaryClickActions.length,
                  })}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{t('board.configureProject')}</span>
            </button>
          </div>
        </div>

        {/* Project Quick Action Buttons Bar + Overall Task Progress */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-2">
            {project.buttons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => onRunButtonAction(btn, project)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                  BUTTON_VARIANT_STYLES[btn.variant || 'secondary']
                }`}
              >
                <ActionIcon
                  name={btn.icon}
                  fallbackType={btn.action.type}
                  className="w-3.5 h-3.5"
                />
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                <span>
                  {t('board.progressSummary', {
                    completed: completedTodos,
                    total: totalTodos,
                    percent,
                  })}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    percent === 100
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar for To-Do Cards */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={cardFilter}
            onChange={(e) => setCardFilter(e.target.value)}
            placeholder={t('board.filterCardsPlaceholder')}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {/* Trello-Style 3-Column Card Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {COLUMNS.map((col, colIdx) => {
          const columnCards = filteredTodos.filter((td) => td.column === col.id);
          const isAddingHere = addingToColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.id);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                if (draggedCardId) {
                  handleMoveCardColumn(draggedCardId, col.id);
                  setDraggedCardId(null);
                }
              }}
              className={`rounded-2xl bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/90 border-t-4 ${
                col.accentClass
              } p-3.5 transition-colors ${
                dragOverColumn === col.id
                  ? 'ring-2 ring-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-950/20'
                  : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotClass}`} />
                  <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                    {t(`board.columns.${col.id}`)}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700">
                    {columnCards.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAddingToColumn(isAddingHere ? null : col.id);
                    setNewTitle('');
                    setNewDesc('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('board.addCard')}</span>
                </button>
              </div>

              {/* Inline Add Card Form */}
              {isAddingHere && (
                <div className="mb-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-500/40 shadow-sm space-y-2">
                  <AutoResizeTextarea
                    autoFocus
                    rows={1}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddCard(col.id);
                      }
                    }}
                    placeholder={t('board.newCardTitlePlaceholder')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs font-semibold leading-snug text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <AutoResizeTextarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleAddCard(col.id);
                      }
                    }}
                    placeholder={t('board.newCardDescPlaceholder')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs leading-relaxed text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAddingToColumn(null)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    >
                      {t('board.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCard(col.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('board.saveCard')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cards Stack */}
              <div className="space-y-2.5 min-h-[120px]">
                {columnCards.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300/80 dark:border-zinc-800 p-6 text-center">
                    <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                      {t('board.emptyColumn')}
                    </p>
                    <p className="text-[11px] text-slate-400/80 dark:text-zinc-600 mt-0.5">
                      {t('board.emptyColumnHint')}
                    </p>
                  </div>
                ) : (
                  columnCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => setDraggedCardId(card.id)}
                      onDragEnd={() => {
                        setDraggedCardId(null);
                        setDragOverColumn(null);
                      }}
                      className={`group rounded-xl bg-white dark:bg-zinc-900 border p-3.5 shadow-sm hover:shadow-md transition-all ${
                        card.completed
                          ? 'border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'border-slate-200/90 dark:border-zinc-800 hover:border-indigo-500/40'
                      }`}
                    >
                      {/* Top Row: Checkbox + Direct Editable Title */}
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleted(card.id)}
                          title={
                            card.completed
                              ? t('board.markIncomplete')
                              : t('board.markCompleted')
                          }
                          className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
                            card.completed
                              ? 'text-emerald-500 hover:text-emerald-600'
                              : 'text-slate-400 hover:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400'
                          }`}
                        >
                          {card.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <AutoResizeTextarea
                          rows={1}
                          value={card.title}
                          onChange={(e) =>
                            handleUpdateCardField(card.id, 'title', e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              (e.target as HTMLTextAreaElement).blur();
                            }
                          }}
                          placeholder={t('board.editCardTitlePlaceholder')}
                          className={`w-full min-w-0 bg-transparent text-sm font-semibold leading-snug focus:outline-none focus:bg-slate-50 dark:focus:bg-zinc-800/70 rounded px-1 -mx-1 transition-colors ${
                            card.completed
                              ? 'line-through text-slate-400 dark:text-zinc-500'
                              : 'text-slate-800 dark:text-zinc-100'
                          }`}
                        />
                      </div>

                      {/* Direct Editable Description */}
                      <div className="mt-1 pl-6">
                        <AutoResizeTextarea
                          rows={1}
                          value={card.description}
                          onChange={(e) =>
                            handleUpdateCardField(
                              card.id,
                              'description',
                              e.target.value
                            )
                          }
                          placeholder={t('board.editCardDescPlaceholder')}
                          className={`w-full min-w-0 bg-transparent text-xs leading-relaxed focus:outline-none focus:bg-slate-50 dark:focus:bg-zinc-800/70 rounded px-1.5 py-1 -mx-1.5 transition-colors ${
                            card.completed
                              ? 'text-slate-400 dark:text-zinc-500'
                              : 'text-slate-600 dark:text-zinc-400 placeholder:text-slate-300 dark:placeholder:text-zinc-600'
                          }`}
                        />
                      </div>

                      {/* Card Footer: Column Move & Delete */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/70 flex items-center justify-between opacity-70 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          {colIdx > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMoveCardColumn(
                                  card.id,
                                  COLUMNS[colIdx - 1].id
                                )
                              }
                              title={t('board.moveLeft')}
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMoveCardColumn(
                                  card.id,
                                  COLUMNS[colIdx + 1].id
                                )
                              }
                              title={t('board.moveRight')}
                              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          title={t('board.deleteCard')}
                          className="p-1 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Overview: Project Notes & Grouped Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Project Notes / Scratchpad */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                {t('board.notesSection.title')}
              </h3>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {t('board.notesSection.savedIndicator')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
            {t('board.notesSection.subtitle')}
          </p>
          <textarea
            rows={6}
            value={project.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder={t('board.notesSection.placeholder')}
            className="w-full flex-1 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 text-xs font-mono leading-relaxed text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y"
          />
        </div>

        {/* Grouped Directories, Actions & Links */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
              {t('board.resourcesSection.title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('board.resourcesSection.subtitle')}
            </p>
          </div>

          {project.rootDirectory && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {t('board.resourcesSection.rootDirLabel')}
                </div>
                <div className="text-xs font-mono text-slate-700 dark:text-zinc-300 truncate mt-0.5">
                  {project.rootDirectory}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onRunSingleAction(
                      {
                        id: 'quick-root-finder',
                        type: 'open_folder',
                        target: project.rootDirectory,
                      },
                      project
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:border-indigo-500"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>{t('board.resourcesSection.openInFinder')}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRunSingleAction(
                      {
                        id: 'quick-root-ide',
                        type: 'open_ide',
                        target: project.rootDirectory,
                        appName: 'Antigravity',
                      },
                      project
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('board.resourcesSection.openInAntigravity')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Primary Click Sequence Summary */}
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-2">
              {t('board.resourcesSection.primaryClickSequence')}
            </div>
            <div className="space-y-1.5">
              {project.primaryClickActions.map((act, idx) => (
                <div
                  key={act.id}
                  onClick={() => onRunSingleAction(act, project)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 dark:bg-zinc-950/50 dark:hover:bg-zinc-800/70 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <ActionIcon
                      fallbackType={act.type}
                      className="w-3.5 h-3.5 text-slate-500 shrink-0"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate">
                      {t(`actionTypes.${act.type}`)}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 truncate max-w-[220px]">
                    {act.target || project.rootDirectory}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
