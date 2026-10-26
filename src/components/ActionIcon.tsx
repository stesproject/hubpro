import React from 'react';
import {
  Sparkles,
  FolderOpen,
  FileText,
  BookOpen,
  Terminal,
  Globe,
  Code2,
  Play,
  Layers,
  ExternalLink,
  Rocket,
  Database,
  Image as ImageIcon,
  Kanban,
} from 'lucide-react';
import { ActionIconName, ActionType } from '../types/project';

interface ActionIconProps {
  name?: ActionIconName;
  fallbackType?: ActionType;
  className?: string;
}

export const ACTION_ICON_OPTIONS: { value: ActionIconName; label: string }[] = [
  { value: 'sparkles', label: 'Sparkles / Antigravity' },
  { value: 'folder', label: 'Folder' },
  { value: 'file-text', label: 'Document / File' },
  { value: 'book-open', label: 'Book / Reference' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'globe', label: 'Globe / Web URL' },
  { value: 'code', label: 'Code' },
  { value: 'play', label: 'Play / Start' },
  { value: 'rocket', label: 'Rocket / Deploy' },
  { value: 'layers', label: 'Layers / Stack' },
  { value: 'external-link', label: 'External Link' },
  { value: 'database', label: 'Database' },
  { value: 'image', label: 'Assets / Media' },
  { value: 'kanban', label: 'Board / Tasks' },
];

export const ActionIcon: React.FC<ActionIconProps> = ({
  name,
  fallbackType,
  className = 'w-4 h-4',
}) => {
  const effectiveName: ActionIconName =
    name ||
    (fallbackType === 'open_ide'
      ? 'sparkles'
      : fallbackType === 'open_app'
        ? 'rocket'
        : fallbackType === 'open_folder'
          ? 'folder'
          : fallbackType === 'open_document'
            ? 'file-text'
            : fallbackType === 'run_command'
              ? 'terminal'
              : fallbackType === 'open_url'
                ? 'globe'
                : 'kanban');

  switch (effectiveName) {
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'folder':
      return <FolderOpen className={className} />;
    case 'file-text':
      return <FileText className={className} />;
    case 'book-open':
      return <BookOpen className={className} />;
    case 'terminal':
      return <Terminal className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'code':
      return <Code2 className={className} />;
    case 'play':
      return <Play className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'external-link':
      return <ExternalLink className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'image':
      return <ImageIcon className={className} />;
    case 'kanban':
      return <Kanban className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};
