import { invoke } from '@tauri-apps/api/core';
import { DEFAULT_PROJECTS } from '../data/defaultProjects';
import { ConfiguredAction, Project } from '../types/project';

const LOCAL_STORAGE_KEY = 'hubpro_projects_v1';

export function isTauriEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
  );
}

export async function getStorageFilePath(): Promise<string> {
  if (isTauriEnvironment()) {
    try {
      return await invoke<string>('get_storage_path');
    } catch {
      return '~/.hubpro/projects.json';
    }
  }
  return '~/.hubpro/projects.json (Browser LocalStorage)';
}

export async function loadProjects(): Promise<Project[]> {
  if (isTauriEnvironment()) {
    try {
      const raw = await invoke<string | null>('load_projects_data');
      if (raw !== null && raw !== undefined) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, raw);
          return parsed;
        }
      }
      // First run or uninitialized: save default projects to ~/.hubpro/projects.json
      await saveProjects(DEFAULT_PROJECTS);
      return DEFAULT_PROJECTS;
    } catch (err) {
      console.warn('Failed to load from Tauri file storage, checking localStorage:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached !== null && cached !== undefined) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read localStorage:', err);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PROJECTS, null, 2));
  return DEFAULT_PROJECTS;
}

export async function saveProjects(projects: Project[]): Promise<void> {
  const serialized = JSON.stringify(projects, null, 2);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('Failed to write to localStorage:', err);
  }

  if (isTauriEnvironment()) {
    try {
      await invoke<string>('save_projects_data', { data: serialized });
    } catch (err) {
      console.error('Failed to save projects to ~/.prohub/projects.json:', err);
    }
  }
}

export async function executeSingleAction(
  action: ConfiguredAction,
  project: Project,
  onOpenBoard?: (project: Project) => void,
  onOpenDocument?: (action: ConfiguredAction, project: Project) => void
): Promise<string> {
  if (action.type === 'open_board') {
    onOpenBoard?.(project);
    return `Opened board for ${project.name}`;
  }

  const effectiveTarget =
    action.target.trim() ||
    (action.type === 'open_ide' || action.type === 'open_folder'
      ? project.rootDirectory
      : '');

  const effectiveWorkDir = action.workingDir?.trim() || project.rootDirectory || undefined;

  // If action is open_document and configured for in-app viewer (or default in_app)
  if (action.type === 'open_document' && action.openMode !== 'system' && onOpenDocument) {
    onOpenDocument(action, project);
    return `Opened document preview: ${action.label || effectiveTarget}`;
  }

  if (!isTauriEnvironment()) {
    if (action.type === 'open_url') {
      const url =
        effectiveTarget.startsWith('http://') || effectiveTarget.startsWith('https://')
          ? effectiveTarget
          : `https://${effectiveTarget}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return `Opened URL: ${url}`;
    }
    if (action.type === 'open_document' && onOpenDocument) {
      onOpenDocument(action, project);
      return `Opened document: ${effectiveTarget}`;
    }
    return `[Preview] ${action.type}: ${effectiveTarget}`;
  }

  return await invoke<string>('execute_action', {
    actionType: action.type,
    target: effectiveTarget,
    workingDir: effectiveWorkDir,
    appName: action.appName || 'Antigravity',
    runInTerminal: action.runInTerminal ?? true,
  });
}

export async function executeActionSequence(
  actions: ConfiguredAction[],
  project: Project,
  onOpenBoard?: (project: Project) => void,
  onOpenDocument?: (action: ConfiguredAction, project: Project) => void
): Promise<string[]> {
  if (!actions || actions.length === 0) {
    onOpenBoard?.(project);
    return [`Opened ${project.name}`];
  }

  const results: string[] = [];
  for (const act of actions) {
    const res = await executeSingleAction(act, project, onOpenBoard, onOpenDocument);
    results.push(res);
  }
  return results;
}

export async function pickFolderNative(): Promise<string | null> {
  if (!isTauriEnvironment()) return null;
  try {
    return await invoke<string | null>('pick_folder_dialog');
  } catch {
    return null;
  }
}

export async function pickDocumentNative(): Promise<string | null> {
  if (!isTauriEnvironment()) return null;
  try {
    return await invoke<string | null>('pick_document_dialog');
  } catch {
    return null;
  }
}

export async function readDocumentFile(path: string): Promise<string> {
  if (!isTauriEnvironment()) {
    throw new Error('Reading local document requires native desktop application.');
  }
  return await invoke<string>('read_document_file', { path });
}

export async function pickImageNative(): Promise<string | null> {
  if (!isTauriEnvironment()) return null;
  try {
    return await invoke<string | null>('pick_image_dialog');
  } catch {
    return null;
  }
}

const imageCache = new Map<string, string>();

export async function resolvePreviewImage(source?: string): Promise<string | null> {
  if (!source || !source.trim()) return null;
  const trimmed = source.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (imageCache.has(trimmed)) {
    return imageCache.get(trimmed)!;
  }

  if (isTauriEnvironment()) {
    try {
      const dataUrl = await invoke<string>('read_local_image', { path: trimmed });
      imageCache.set(trimmed, dataUrl);
      return dataUrl;
    } catch (err) {
      console.warn('Could not load local preview image:', trimmed, err);
      return null;
    }
  }

  return null;
}
