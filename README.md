# HubPro - Personal Project Workspace & Command Center

HubPro is a lightweight, native macOS & cross-platform desktop application built with **Tauri v2**, **React**, **TypeScript**, and **Tailwind CSS** to organize all your active development projects in one clean, modern hub.

## Key Features

- **Modern Grid Interface**: Filterable in real time by project name, category, pinned status, or active tasks.
- **Customizable Project Cards**:
  - Optional preview cover image (local file path or external URL) or curated fallback gradients.
  - At-a-glance task completion progress bar and top pending tasks directly on the card.
- **Configurable Primary Click Actions**:
  - Clicking a project card triggers one or multiple actions in sequence (e.g., open directory in **Antigravity IDE** + open assets folder in **Finder** + start dev server in **Terminal**).
- **Configurable Quick Action Buttons**:
  - Add any number of buttons underneath each project card with custom labels, icons, color styles, and actions:
    - **Open in IDE / App** (`Antigravity`, `Visual Studio Code`, `Cursor`, `Zed`, `Godot`, `Xcode`, etc.)
    - **Open Folder in Finder**
    - **Run Terminal Command** (interactive `Terminal.app` window or background execution)
    - **Open External URL** (deployed domains, Cloudflare dashboard, localhost, docs)
    - **Open Project Board & Overview**
- **Trello-Style To-Do Board & Project Overview**:
  - Dedicated 3-column card board (**To Do**, **In Progress**, **Completed**) per project.
  - Every card has an inline-editable **Title**, **Description**, and a **Checkbox** to toggle completion without opening nested modals.
  - Includes a dedicated **Project Notes & Scratchpad** and grouped resources summary.
- **Automatic System Theme (Light & Dark)**:
  - Synchronizes automatically with macOS system appearance (`prefers-color-scheme`), with a quick manual toggle in the top header.
- **Separated i18n JSON**:
  - All UI strings are stored in [`src/i18n/en.json`](./src/i18n/en.json) for easy customization.

## Getting Started

### Run in Development Mode (Desktop Window)
```bash
npm run tauri:dev
```

### Build Native macOS `.app` / `.dmg`
```bash
npm run tauri:build
```

## Data Storage
All your projects, custom buttons, click sequences, to-do cards, and notes are automatically saved in:
```text
~/.hubpro/projects.json
```
## Creating a New Release

HubPro includes an automated GitHub Actions CI/CD workflow in [`.github/workflows/release.yml`](./.github/workflows/release.yml). When you push a version tag (e.g. `v1.0.0`), the workflow automatically:

1. Compiles native desktop bundles concurrently across platforms:
   - **macOS Apple Silicon**: `.dmg` (`aarch64`)
   - **Windows**: `.exe` (NSIS installer) and `.msi`
   - **Linux**: `.AppImage` and `.deb`
2. Creates a published **GitHub Release** corresponding to the tag.
3. Uploads all installer binaries directly to the release page in the repository.

To release a new version:
```bash
git tag v1.0.0
git push origin v1.0.0
```

