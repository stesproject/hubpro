import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  X,
  CheckCircle2,
  ListTodo,
  Pin,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  ConfiguredAction,
  Project,
  ProjectActionButton,
} from './types/project';
import {
  executeActionSequence,
  executeSingleAction,
  loadProjects,
  saveProjects,
} from './services/bridge';
import { ProjectCard } from './components/ProjectCard';
import { ProjectBoardView } from './components/ProjectBoardView';
import { ProjectConfigModal } from './components/ProjectConfigModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';

interface ToastNotification {
  id: string;
  type: 'success' | 'error';
  text: string;
}

export const App: React.FC = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Filtering & Navigation State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyPendingTodos, setOnlyPendingTodos] = useState(false);

  // Active Project Board View (null = Hub Grid View)
  const [activeBoardProjectId, setActiveBoardProjectId] = useState<
    string | null
  >(null);

  // Active In-App Document Viewer Modal State
  const [activeDocumentState, setActiveDocumentState] = useState<{
    action: ConfiguredAction;
    project: Project;
  } | null>(null);

  // Project Configuration Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Toast feedback
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const pushToast = (text: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setToasts((prev) => [...prev.slice(-2), { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  };

  // Sync theme automatically with macOS prefers-color-scheme
  useEffect(() => {
    localStorage.removeItem('prohub_theme_mode');
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  // Initial Load of Projects
  useEffect(() => {
    let mounted = true;
    loadProjects().then((initialProjects) => {
      if (!mounted) return;
      setProjects(initialProjects);
      setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const persistAndSetProjects = (nextProjects: Project[]) => {
    setProjects(nextProjects);
    saveProjects(nextProjects);
  };

  // Distinct categories and counts for filter pills
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category?.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [projects]);

  const filterCounts = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let pinned = 0;
    let withPendingTodos = 0;

    for (const p of projects) {
      const cat = p.category?.trim();
      if (cat) {
        const key = cat.toLowerCase();
        byCategory[key] = (byCategory[key] || 0) + 1;
      }
      if (p.pinned) pinned++;
      if (p.todos.some((td) => !td.completed)) withPendingTodos++;
    }

    return {
      all: projects.length,
      byCategory,
      pinned,
      withPendingTodos,
    };
  }, [projects]);

  // Filtered & sorted projects (pinned first)
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (onlyPinned && !p.pinned) return false;
        if (
          onlyPendingTodos &&
          !p.todos.some((td) => !td.completed)
        ) {
          return false;
        }
        if (
          selectedCategory !== 'ALL' &&
          p.category.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchTagline = p.tagline?.toLowerCase().includes(q);
          const matchCat = p.category?.toLowerCase().includes(q);
          const matchPath = p.rootDirectory?.toLowerCase().includes(q);
          return matchName || matchTagline || matchCat || matchPath;
        }
        return true;
      })
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [
    projects,
    searchQuery,
    selectedCategory,
    onlyPinned,
    onlyPendingTodos,
  ]);

  const activeBoardProject = useMemo(
    () => projects.find((p) => p.id === activeBoardProjectId) || null,
    [projects, activeBoardProjectId]
  );

  // Action Execution Handlers
  const handleOpenDocument = (action: ConfiguredAction, project: Project) => {
    setActiveDocumentState({ action, project });
  };

  const handleOpenDocumentExternally = async (
    action: ConfiguredAction,
    project: Project
  ) => {
    try {
      const msg = await executeSingleAction(
        { ...action, openMode: 'system' },
        project
      );
      pushToast(t('toast.actionSuccess', { message: msg }), 'success');
    } catch (err) {
      pushToast(
        t('toast.actionError', { error: String(err) }),
        'error'
      );
    }
  };

  const handleCardPrimaryClick = async (project: Project) => {
    try {
      const messages = await executeActionSequence(
        project.primaryClickActions,
        project,
        (proj) => setActiveBoardProjectId(proj.id),
        handleOpenDocument
      );
      if (messages.length > 0 && project.primaryClickActions.length > 0) {
        pushToast(
          t('toast.actionSuccess', { message: messages.join(' • ') }),
          'success'
        );
      }
    } catch (err) {
      pushToast(
        t('toast.actionError', { error: String(err) }),
        'error'
      );
    }
  };

  const handleButtonActionClick = async (
    button: ProjectActionButton,
    project: Project
  ) => {
    try {
      const msg = await executeSingleAction(
        button.action,
        project,
        (proj) => setActiveBoardProjectId(proj.id),
        handleOpenDocument
      );
      pushToast(t('toast.actionSuccess', { message: msg }), 'success');
    } catch (err) {
      pushToast(
        t('toast.actionError', { error: String(err) }),
        'error'
      );
    }
  };

  const handleSingleActionExecution = async (
    action: ConfiguredAction,
    project: Project
  ) => {
    try {
      const msg = await executeSingleAction(
        action,
        project,
        (proj) => setActiveBoardProjectId(proj.id),
        handleOpenDocument
      );
      pushToast(t('toast.actionSuccess', { message: msg }), 'success');
    } catch (err) {
      pushToast(
        t('toast.actionError', { error: String(err) }),
        'error'
      );
    }
  };

  // Project CRUD Handlers
  const handleSaveProject = (saved: Project) => {
    const exists = projects.some((p) => p.id === saved.id);
    const next = exists
      ? projects.map((p) => (p.id === saved.id ? saved : p))
      : [saved, ...projects];
    persistAndSetProjects(next);
    setEditingProject(null);
    setIsCreatingNew(false);
    pushToast(t('toast.projectSaved', { name: saved.name }), 'success');
  };

  const handleDeleteProject = (projectId: string) => {
    const next = projects.filter((p) => p.id !== projectId);
    persistAndSetProjects(next);
    if (activeBoardProjectId === projectId) {
      setActiveBoardProjectId(null);
    }
    setEditingProject(null);
    setIsCreatingNew(false);
    pushToast(t('toast.projectDeleted'), 'success');
  };

  const handleDuplicateProject = (source: Project) => {
    const copy: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: `proj-${Date.now()}`,
      name: `${source.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    persistAndSetProjects([copy, ...projects]);
    setEditingProject(null);
    setIsCreatingNew(false);
    pushToast(t('toast.projectSaved', { name: copy.name }), 'success');
  };

  const handleTogglePin = (project: Project) => {
    const next = projects.map((p) =>
      p.id === project.id ? { ...p, pinned: !p.pinned } : p
    );
    persistAndSetProjects(next);
  };

  const handleQuickToggleTodo = (projectId: string, todoId: string) => {
    const next = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        todos: p.todos.map((td) =>
          td.id === todoId
            ? {
                ...td,
                completed: !td.completed,
                column: !td.completed ? ('done' as const) : ('todo' as const),
              }
            : td
        ),
        updatedAt: new Date().toISOString(),
      };
    });
    persistAndSetProjects(next);
  };

  if (!loaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col">
      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {activeBoardProject ? (
          <ProjectBoardView
            project={activeBoardProject}
            onBack={() => setActiveBoardProjectId(null)}
            onUpdateProject={handleSaveProject}
            onEditProject={(proj) => {
              setEditingProject(proj);
              setIsCreatingNew(false);
            }}
            onRunPrimaryActions={handleCardPrimaryClick}
            onRunButtonAction={handleButtonActionClick}
            onRunSingleAction={handleSingleActionExecution}
          />
        ) : (
          <div className="space-y-6">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              {/* Name Filter Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('app.searchPlaceholder')}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    title={t('app.clearSearch')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category & Quick Filter Pills */}
              <div className="flex items-center flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {t('app.allCategories')} ({filterCounts.all})
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === cat ? 'ALL' : cat
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {cat} ({filterCounts.byCategory[cat.toLowerCase()] || 0})
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

                <button
                  type="button"
                  onClick={() => setOnlyPinned((v) => !v)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    onlyPinned
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Pin className="w-3 h-3" />
                  <span>
                    {t('app.pinnedOnly')} ({filterCounts.pinned})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyPendingTodos((v) => !v)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    onlyPendingTodos
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>
                    {t('app.activeTodosFilter')} ({filterCounts.withPendingTodos})
                  </span>
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onCardClick={handleCardPrimaryClick}
                    onButtonClick={handleButtonActionClick}
                    onOpenBoard={(proj) => setActiveBoardProjectId(proj.id)}
                    onEditProject={(proj) => {
                      setEditingProject(proj);
                      setIsCreatingNew(false);
                    }}
                    onTogglePin={handleTogglePin}
                    onQuickToggleTodo={handleQuickToggleTodo}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {projects.length === 0
                    ? t('app.emptyState.noProjectsTitle')
                    : t('app.emptyState.noMatchTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-4">
                  {projects.length === 0
                    ? t('app.emptyState.noProjectsDescription')
                    : t('app.emptyState.noMatchDescription')}
                </p>
                {projects.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setIsCreatingNew(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('app.emptyState.createFirst')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setOnlyPinned(false);
                      setOnlyPendingTodos(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200"
                  >
                    {t('app.emptyState.resetFilters')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating + New Project Button */}
      <button
        type="button"
        onClick={() => {
          setEditingProject(null);
          setIsCreatingNew(true);
        }}
        title={t('app.newProject')}
        aria-label={t('app.newProject')}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create / Edit Project Modal */}
      {(isCreatingNew || editingProject) && (
        <ProjectConfigModal
          project={editingProject}
          isNew={isCreatingNew}
          onClose={() => {
            setEditingProject(null);
            setIsCreatingNew(false);
          }}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
          onDuplicate={handleDuplicateProject}
        />
      )}

      {/* In-App Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(activeDocumentState)}
        action={activeDocumentState?.action || null}
        project={activeDocumentState?.project || null}
        onClose={() => setActiveDocumentState(null)}
        onOpenExternally={handleOpenDocumentExternally}
      />

      {/* Floating Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md transition-all ${
                toast.type === 'error'
                  ? 'bg-rose-600/95 text-white border-rose-500'
                  : 'bg-zinc-900/95 dark:bg-zinc-800/95 text-white border-zinc-700'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-200" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span className="truncate">{toast.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
