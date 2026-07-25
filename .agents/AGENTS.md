# Project Rules & Context: MERN Thinkboard

This file contains architecture context, project features, and strict behavioral guidelines for AI agents and developers working on the MERN Thinkboard workspace.

## Tech Stack Overview
- **Type**: MERN Stack Task Management & Kanban Application (MongoDB, Express, React, Node.js).
- **Frontend Framework**: React 19 via Vite.
- **Frontend Styling**: Tailwind CSS with daisyUI component library and Lucide React icons (`lucide-react`).
- **Routing**: React Router v7.
- **HTTP Client**: Axios (`frontend/src/lib/axios.js`).
- **Backend Framework**: Express.js (REST API architecture).
- **Database & Modeling**: MongoDB via Mongoose.
- **Caching & Rate Limiting**: Redis via Upstash & ioredis.
- **Deployment**: Docker containerization, compatible with EasyPanel and equivalent modern orchestrators.

## Core Domain & Architectural Context
- **Task & Board Management**: Projects are structured around notes/tasks displayed across Kanban boards (`NoteKanbanView.jsx`) and Lists (`NoteListView.jsx`).
- **Detailed Note Interface (`NoteDetailPage.jsx`)**:
  - **Compact & Clean UI**: Maintain minimal unnecessary top padding and horizontal-first alignment (e.g., inline labels row and tight section gaps) to match professional productivity tools (like Trello or Linear).
  - **Checklists**: Supports inline item title editing (via pencil button/double click), toggling completion, and automatic compact scroll view (`max-h-[240px]`) with expand/collapse controls ("Ver todas / Contraer") when exceeding 4 items.
  - **Comments & Threads**: Activities include system actions and user comments. Comments support 1-level threaded replies (`parentId`). By default, UI restricts initial discussion feed to the last 3 main comments with a "View More" toggle.
  - **Dynamic Metadata**: Task statuses, priorities, assigned team members, and colored labels can be modified inline via tailored dropdowns.
  - **Markdown Editor**: Task descriptions are rendered and edited using customizable Markdown components (`MarkdownEditor.jsx` & `MarkdownRenderer.jsx`).

## Coding Guidelines
- **ES Modules Only**: Both `frontend` and `backend` strictly rely on ES Modules (`"type": "module"` in package.json). Always use `import`/`export` syntax, never use `require()`.
- **Environment Variables**: Managed via `dotenv`. Backend relies on `MONGO_URI`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `NODE_ENV`.
- **Development Workflows**:
  - Run frontend dev server: `cd frontend && npm run dev`.
  - Run backend dev server (via nodemon): `cd backend && npm run dev`.
- **Styling & Aesthetics**:
  - Prioritize standard Tailwind CSS utility classes and daisyUI components.
  - Avoid adding custom vanilla CSS unless strictly required.
  - Maintain consistent Spanish localized terminology in the UI (e.g., "Checklist", "Etiquetas", "Descripción", "Ocultar completados", "Eliminar", etc.) unless otherwise directed by the user.
  - Avoid heavy, grotesque typography (e.g., steer away from unnecessary `font-extrabold` headlines; use refined weights like `font-semibold` or `font-medium`).
- **Linting & Verification**: ESLint is configured in the frontend (`cd frontend && npm run lint`). Always maintain lint-compliant syntax and ensure components are exported cleanly.
- **Responsive UI**: Ensure all pages and modals look excellent across mobile, tablet, and desktop viewports using Tailwind's responsive prefixes.

