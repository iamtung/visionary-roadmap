# Agent Context: Visionary Roadmap

## Project Overview

**Visionary Roadmap** is a React-based application designed to visualize product roadmaps on a timeline. It allows users to manage tasks, categorize them, and visualize them across a yearly timeline (weeks/quarters). It features AI-powered roadmap generation using Google's Gemini API.

## Technical Stack

- **Framework**: React 19 + Vite + TypeScript.
- **Styling**: Tailwind-like utilities (Lucide React for icons, custom CSS in App/components).
- **State Management**: Local state in `App.tsx` (React `useState`).
- **AI Integration**: Google GenAI SDK (`@google/genai`) accessing Gemini models (`gemini-3-flash-preview`).
- **Build Tool**: Vite.
- **Utilities**: `html2canvas` for exporting the roadmap as an image.

## Key Components

### `App.tsx`

The central controller of the application.

- **State**: Manages `tasks`, `categories`, and UI state (modals, dragging).
- **Handlers**: `handleSaveTask`, `handleDeleteTask`, `handleMoveArea`, `handleExportImage`, etc.
- **Layout**: Composes the `RoadmapGrid`, `Modal`, and control buttons.

### `components/RoadmapGrid.tsx`

(Inferred) The main visualization component that renders:

- Time headers (Months/Quarters).
- Category rows (Swimlanes).
- Task bars positioned by `startWeek` and `durationWeeks`.

### `services/geminiService.ts`

Handles interaction with the Gemini API.

- **Function**: `generateRoadmapSuggestions(productDescription)`
- **Model**: `gemini-3-flash-preview`
- **Output**: JSON array of tasks (`name`, `description`, `category`, `startWeek`, `durationWeeks`).

### `types.ts`

Defines the core data models:

- **Task**: `{ id, name, description, category, startWeek, durationWeeks }`
- **Category**: `{ id, name, color }`

## Configuration

- **Environment Variables**:
  - `GEMINI_API_KEY`: Required in `.env.local`.
  - Mapped in `vite.config.ts` to `process.env.API_KEY` for use in code.
- **Port**: defaults to `3000`.

## Development Workflows

- **Start Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Agent Guidelines

- **State Changes**: Most logic resides in `App.tsx`. Refactoring usually involves passing props down or lifting state up to `App`.
- **AI Features**: When modifying AI features, check `services/geminiService.ts` and ensure strict JSON schema is maintained for reliable parsing.
- **Styling**: Check `App.tsx` and specific component files.
