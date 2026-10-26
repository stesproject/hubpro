import { Project } from '../types/project';

export const GRADIENT_PRESETS = [
  {
    id: 'indigo-violet',
    label: 'Indigo & Violet',
    value: 'from-indigo-600 via-violet-600 to-purple-700',
  },
  {
    id: 'emerald-teal',
    label: 'Emerald & Cyan',
    value: 'from-emerald-600 via-teal-600 to-cyan-700',
  },
  {
    id: 'amber-rose',
    label: 'Amber & Rose',
    value: 'from-amber-500 via-orange-600 to-rose-600',
  },
  {
    id: 'sky-indigo',
    label: 'Ocean Blue',
    value: 'from-sky-500 via-blue-600 to-indigo-700',
  },
  {
    id: 'fuchsia-pink',
    label: 'Cyber Magenta',
    value: 'from-fuchsia-600 via-pink-600 to-rose-700',
  },
  {
    id: 'slate-zinc',
    label: 'Graphite Obsidian',
    value: 'from-slate-700 via-zinc-800 to-neutral-900',
  },
  {
    id: 'rose-red',
    label: 'Crimson Scarlet',
    value: 'from-rose-600 via-red-600 to-orange-700',
  },
  {
    id: 'lime-emerald',
    label: 'Forest & Lime',
    value: 'from-lime-500 via-green-600 to-emerald-800',
  },
  {
    id: 'violet-midnight',
    label: 'Midnight Nebula',
    value: 'from-violet-700 via-indigo-800 to-slate-900',
  },
];

export const DEFAULT_PROJECTS: Project[] = [];
