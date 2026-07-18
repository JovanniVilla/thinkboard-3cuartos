# Project Rules: MERN Thinkboard

This file contains rules and guidelines for agents working on this project.

## Tech Stack Overview
- **Type**: MERN Stack App (MongoDB, Express, React, Node.js)
- **Frontend Framework**: React 19 via Vite.
- **Frontend Styling**: Tailwind CSS with daisyUI.
- **Routing**: React Router v7.
- **HTTP Client**: Axios (frontend).
- **Backend Framework**: Express.js.
- **Database**: MongoDB via Mongoose.
- **Caching/Rate Limiting**: Redis via Upstash & ioredis.

## Guidelines
- Both `frontend` and `backend` use ES Modules (`"type": "module"`). Use `import`/`export` syntax, not `require()`.
- **Environment Variables**: Managed via `dotenv`. The backend expects `MONGO_URI`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `NODE_ENV`.
- **Development**:
  - Run the frontend with `cd frontend && npm run dev`.
  - Run the backend with `cd backend && npm run dev` (uses nodemon).
- **Styling**: Use Tailwind CSS utility classes and daisyUI components. Avoid adding custom vanilla CSS unless necessary.
- **Linting**: ESLint is configured in the frontend; ensure code passes `npm run lint`.
- Ensure responsive UI designs leveraging Tailwind's responsive prefixes.
