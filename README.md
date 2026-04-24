# Writing Tools

A complete browser-based book writing application built with React, TypeScript, and Vite.

## Features

- **Project Management** – Create, edit, and delete book projects with title, author, and description
- **WYSIWYG Editor** – Rich text editing powered by TipTap (bold, italic, underline, headings, blockquotes, text alignment)
- **Chapter & Section Hierarchy** – Organize content into chapters (regular, introduction, foreword, epigraph, appendix, about author) with optional sub-sections
- **Drag & Drop Reordering** – Reorder chapters and sections via drag and drop using @dnd-kit
- **Multi-language Support** – Write content in EN, PT-BR, ES, FR, and DE for the same chapter/section
- **PDF Export** – Export any chapter or section to PDF with configurable page size, fonts, and margins
- **Project Settings** – Configure page size (A4/A5/Letter), margins, font family/size, line spacing, and chapter title format
- **Offline-first Storage** – All data stored locally in the browser via PouchDB (no backend required)

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [TipTap](https://tiptap.dev/) – Rich text editor
- [PouchDB](https://pouchdb.com/) – Browser-based local database
- [@dnd-kit](https://dndkit.com/) – Drag and drop
- [Tailwind CSS v3](https://tailwindcss.com/) – Utility-first styling
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) – PDF export
- [React Router](https://reactrouter.com/) – Client-side routing
