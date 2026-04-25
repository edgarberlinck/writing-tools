<div align="center">
  <img src="./app-icon.png" alt="Writing Tools icon" width="120" />

# Writing Tools

**A free, offline-first desktop app for authors who want to focus on writing — not on tooling.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2019-61dafb?logo=react)](https://react.dev/)
[![Electron](https://img.shields.io/badge/Desktop-Electron-47848f?logo=electron)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)

> Write books, organize chapters, plan with moodboards, and export to PDF — all locally, with no account required.

</div>

---

## ✨ What is Writing Tools?

Writing Tools is a minimalist book writing application for authors. It runs on **macOS, Windows, and Linux** as a native desktop app (via Electron), and also works entirely in the browser. All your data stays **on your machine** — no cloud sync, no subscriptions, no telemetry.

Whether you're writing your first novel or your tenth, Writing Tools gives you a clean, distraction-free environment with just the right amount of structure.

---

## 🚀 Features

### 📚 Project Management

- Create multiple book projects, each with title, author name, and description
- Switch between projects instantly from the home screen

### ✍️ Rich Text Editor

- WYSIWYG editing powered by [TipTap](https://tiptap.dev/)
- Bold, italic, underline, headings (H1–H3), blockquotes, text alignment
- Clean reading mode — the editor gets out of your way
- **Auto-focus**: the editor receives focus automatically when you select a chapter or section
- **Instant autosave**: every keystroke is saved immediately — no debounce, no risk of losing work if the app closes unexpectedly

### 🗂️ Chapter & Section Hierarchy

- Multiple chapter types: **Regular**, **Introduction**, **Foreword**, **Epigraph**, **Appendix**, **About the Author**
- Optional sub-sections inside each chapter
- Drag-and-drop reordering of both chapters and sections

### 🌍 Multi-language Writing

- Write the same chapter in up to 5 languages: **EN, PT-BR, ES, FR, DE**
- Each language tab stores independent content — great for translated editions
- **Split View**: open two languages side by side and edit them simultaneously — perfect for translating or reviewing a localized version while writing

### 🎨 Moodboard Chapters

- Special chapter type for visual planning and inspiration boards
- Upload reference images and position them freely on the canvas
- Drawing tools: **pen**, **line**, **rectangle**, **circle**, **text**
- Select, move, and delete any drawn element
- Download your moodboard as a PNG

### 📄 PDF Export

- Export any chapter or section to a properly formatted PDF
- Configurable page size (A4, A5, Letter), margins, font family, font size, and line spacing
- Optional inclusion of moodboard chapters in export

### ⚙️ Project Settings

- Per-project page layout settings
- Chapter title formatting options
- Font and spacing controls

### 💾 Offline-first Storage

- All data stored locally via [PouchDB](https://pouchdb.com/) (IndexedDB under the hood)
- No backend, no account, no internet connection required
- Your words belong to you

---

## 🖥️ Running as a Desktop App

Pre-built binaries for **macOS (DMG)**, **Windows (installer)**, and **Linux (AppImage)** can be built from source (see [Build Your Own Version](#-build-your-own-version) below).

### Development mode (desktop)

```bash
npm install
npm run desktop:dev
```

This launches the Vite dev server and opens the Electron window simultaneously with hot reload.

---

## 🌐 Running in the Browser

Writing Tools also runs as a standard web app:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔨 Build Your Own Version

### Prerequisites

- **Node.js** 18+ and **npm**
- macOS is required to build the `.dmg` for Mac
- Windows (or Wine on macOS/Linux) is required to build the Windows installer

### 1. Clone the repository

```bash
git clone https://github.com/edgarberlink/writing-tools.git
cd writing-tools
npm install
```

### 2. Build for your platform

```bash
# macOS (.dmg)
npm run desktop:build:mac

# Windows (.exe installer)
npm run desktop:build:win

# Both platforms at once
npm run desktop:build:all
```

The release packages will be in the `release/` folder.

> Each desktop build automatically increments the patch version (e.g. `1.0.2` → `1.0.3`).

### 3. Web-only build

```bash
npm run build
# Output goes to dist/
```

### Version management

```bash
npm run version:patch   # 1.0.x → 1.0.x+1
npm run version:minor   # 1.x.0 → 1.x+1.0
npm run version:major   # x.0.0 → x+1.0.0
```

---

## 🧪 Tests

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# End-to-end tests (Playwright)
npm run test:e2e
```

---

## 🛠️ Tech Stack

| Layer            | Technology                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------- |
| UI Framework     | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)               |
| Build Tool       | [Vite](https://vitejs.dev/)                                                                  |
| Desktop Shell    | [Electron](https://www.electronjs.org/)                                                      |
| Rich Text Editor | [TipTap](https://tiptap.dev/)                                                                |
| Local Database   | [PouchDB](https://pouchdb.com/) (IndexedDB)                                                  |
| Drag & Drop      | [@dnd-kit](https://dndkit.com/)                                                              |
| Styling          | [Tailwind CSS v3](https://tailwindcss.com/)                                                  |
| PDF Export       | [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) |
| Routing          | [React Router v7](https://reactrouter.com/)                                                  |
| Testing          | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)                        |

---

## 📄 License

MIT — free to use, fork, and modify.

---

## 💛 Author

Made with love by [@Edgar Muniz Berlinck](https://github.com/edgarberlink)

This app is **free, and will always be**. If it helps your writing journey, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%E2%98%95-yellow)](https://buymeacoffee.com/edgarberlinck)
