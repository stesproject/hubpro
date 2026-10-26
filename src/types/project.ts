export type ActionType =
  | 'open_ide'
  | 'open_folder'
  | 'run_command'
  | 'open_url'
  | 'open_board'
  | 'open_app';

export type ActionIconName =
  | 'sparkles'
  | 'folder'
  | 'terminal'
  | 'globe'
  | 'code'
  | 'play'
  | 'layers'
  | 'external-link'
  | 'rocket'
  | 'database'
  | 'image'
  | 'kanban';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'emerald'
  | 'amber'
  | 'violet';

export interface ConfiguredAction {
  id: string;
  type: ActionType;
  label?: string;
  /** Path for open_folder/open_ide, URL for open_url, or shell command for run_command */
  target: string;
  /** Optional working directory override (falls back to project.rootDirectory) */
  workingDir?: string;
  /** IDE/App name for open_ide (e.g., "Antigravity", "Visual Studio Code", "Cursor", "Godot") */
  appName?: string;
  /** For run_command: whether to open an interactive Terminal.app window (default true) */
  runInTerminal?: boolean;
}

export interface ProjectActionButton {
  id: string;
  label: string;
  icon: ActionIconName;
  variant: ButtonVariant;
  action: ConfiguredAction;
}

export type TodoColumnId = 'todo' | 'in_progress' | 'done';

export interface TodoCard {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  column: TodoColumnId;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  category: string;
  rootDirectory: string;
  previewImage?: string;
  accentGradient: string;
  pinned?: boolean;
  /** One or more actions executed when clicking the main project card */
  primaryClickActions: ConfiguredAction[];
  /** Individual configurable buttons shown beneath the card */
  buttons: ProjectActionButton[];
  /** Dedicated Trello-style To-Do cards */
  todos: TodoCard[];
  /** Freeform notes / scratchpad for the project */
  notes: string;
  updatedAt: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';
