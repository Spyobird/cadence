# Cadence - Quarterly Goal Manager

A minimal, local-first PWA for iOS designed for quarterly alignment and daily reflection.

## Project Guidelines

### Core Principles
- **Minimalism:** Focus on the "Life" and "Work" quests only. Avoid feature creep.
- **Local-First:** All data lives in IndexedDB via `idb-keyval`. No server, no login.
- **Low Friction:** Daily check-ins must be as fast as possible.
- **iOS Optimized:** Design for "Add to Home Screen" and handle safe-area insets.

### Technical Standards
- **Framework:** React + Vite + Tailwind CSS.
- **Storage:** `idb-keyval` for IndexedDB access.
- **State Management:** Custom hooks (`useQuests`, `useReflections`).
- **Styling:** Mobile-first, high contrast, touch-friendly components.
- **Versioning:** Quests are never overwritten; every edit creates a new version.

### Development Workflow
- **TDD:** Write failing tests for core logic (especially versioning and rotation) before implementing.
- **Commits:** Small, atomic commits after every successful task step.
- **PWA:** Always verify PWA manifest and service worker functionality.

### Development Tools & Context
- **Documentation Retrieval**: You must use the Context7 MCP tools (`resolve-library-id` and `query-docs`) whenever the user asks for code generation, setup, or configuration steps involving external dependencies.
- **Anti-Hallucination Rule**: Never guess package APIs or use outdated pre-2025 training data. Check live docs via Context7 first.
- **Design**: Follow design principles from `DESIGN.md`

## Common Commands

### Development
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing
- `npm test` - Run vitest tests in watch mode
- `npm test -- --run` - Run tests once (for CI)
- `npm run test:ui` - Run vitest with UI
- `npm run test:coverage` - Run tests with coverage report
- `npx ts-node src/test-db.ts` - Verify IndexedDB storage layer directly

### Phone Testing (PWA requires HTTPS)
- `npm run dev` + `npx ngrok http 5173` - Tunnel for phone install
- `npm run preview` + `npx ngrok http 4173` - Test production build

## Project Structure
- `src/main.tsx`: App entry point.
- `src/index.css`: Tailwind CSS imports and global styles.
- `src/App.tsx`: Root component with navigation state.
- `src/lib/db.ts`: IndexedDB wrapper using `idb-keyval`.
- `src/hooks/`: Business logic hooks (`useQuests`, `useReflections`).
- `src/components/`: UI components (Onboarding, Dashboard, QuestForm, ReflectionLog, EvolutionLab).
- `src/constants/`: Static data (Weekly prompts).
- `src/test/`: Test setup (`setup.ts`) and env check utilities.
- `vite.config.ts`: Vite config with PWA plugin.

## Environment Notes
- **Vite Config:** Use `server: { host: true }` in devcontainers/tunnels to allow external access.
- **React Plugin:** Use `@vitejs/plugin-react` (not `-swc`) — SWC plugin crashes on Arm64/Node 18 with "path argument undefined".
- **Node Version:** Current environment is Node 18; SWC plugin requires Node 20.19+ or 22.12+.
- **PWA Install:** Requires HTTPS (use ngrok/localtunnel); won't work on plain HTTP.
