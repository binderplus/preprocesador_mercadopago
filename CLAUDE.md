# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Preprocesador Mercado Pago — a React SPA that transforms Mercado Pago settlement report CSVs into a bank-like XLSX format suitable for non-MP reconciliation systems. Live at https://premp.binderplus.com.ar/

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build (outputs to `dist/`)
- `npm run lint` — ESLint (flat config, ESLint 9.x)
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

```
index.html → main.jsx → App.jsx → FileHandler.jsx → Preprocessor.js → PreprocessorWorker.js (Web Worker)
```

- **App.jsx** — Root component, renders title/instructions and `<FileHandler />`
- **FileHandler.jsx** — Dropzone UI (react-dropzone) for CSV/XLSX upload. Calls `Preprocessor.process(file)` on drop
- **Preprocessor.js** — Orchestrator that spawns a Web Worker and bridges file I/O via `postMessage`
- **PreprocessorWorker.js** — All data transformation logic runs off-main-thread. Uses `xlsx` library for read/write

### Two-phase transformation system in PreprocessorWorker.js

1. **updateRules** — Array of functions that modify each row in-place (delete columns, format dates, translate descriptions)
2. **transposeRules** — Object of functions that create new rows from specific columns (tax disaggregation, MP fees). Each transposed row gets a recalculated balance

Rows without `EXTERNAL_REFERENCE` are filtered out (summary rows).

To extend processing: add functions to `updateRules` array or entries to `transposeRules` object.

## Conventions

- JavaScript/JSX only (no TypeScript)
- CSS Modules for component styles (`*.module.css`), global styles in `index.css`
- PascalCase component files, camelCase functions/variables, UPPERCASE spreadsheet column names
- Dark/light mode via `prefers-color-scheme` media query
- Node 20 in CI

## Deployment

GitHub Actions (`.github/workflows/main.yml`) auto-deploys `main` branch to GitHub Pages. Push to `main` triggers build + deploy.

## Git Workflow

- `main` — production (deployed)
- `dev` — development/integration
- PRs required for merging to main