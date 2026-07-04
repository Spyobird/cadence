# Quarterly Goal Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first PWA for iOS that manages two versioned quarterly goals (Life/Work) and a daily rotating reflection system.

**Architecture:** React SPA using Vite and Tailwind CSS. Data is stored locally in IndexedDB via `idb-keyval` to ensure zero-friction daily check-ins and total privacy.

**Tech Stack:** React, Vite, Tailwind CSS, `idb-keyval`, `vite-plugin-pwa`.

---

## File Structure

- `index.html`: Root HTML with iOS PWA meta tags.
- `vite.config.ts`: Vite configuration with PWA plugin.
- `public/manifest.json`: Web app manifest for iOS "Add to Home Screen".
- `src/main.tsx`: Application entry point.
- `src/App.tsx`: Root component and high-level navigation state.
- `src/lib/db.ts`: IndexedDB wrapper using `idb-keyval`.
- `src/constants/prompts.ts`: The 7-day rotating reflection prompts.
- `src/hooks/useQuests.ts`: Logic for quest CRUD and versioning.
- `src/hooks/useReflections.ts`: Logic for daily reflection storage and retrieval.
- `src/components/Layout.tsx`: Wrapper handling iOS safe-area insets.
- `src/components/Onboarding.tsx`: Sequential setup for Life and Work quests.
- `src/components/QuestForm.tsx`: Reusable form based on `scaffold.md`.
- `src/components/Dashboard.tsx`: Home screen (Quest summaries + daily reflection inputs).
- `src/components/EvolutionLab.tsx`: Quest version history and update interface.
- `src/components/ReflectionLog.tsx`: Chronological archive of reflections.

---

## Implementation Tasks

### Task 1: Project Foundation & PWA Setup

**Files:**
- Create: `package.json`, `vite.config.ts`, `index.html`, `public/manifest.json`, `tailwind.config.js`, `postcss.config.js`

- [ ] **Step 1: Initialize Vite + React + TS project**
  Run: `npm create vite@latest . -- --template react-ts`
- [ ] **Step 2: Install Tailwind CSS and dependencies**
  Run: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
- [ ] **Step 3: Configure Tailwind content paths**
  Modify `tailwind.config.js`:
  ```javascript
  /** @type {import('tailwindcss').Config} */
  export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: { extend: {} },
    plugins: [],
  }
  ```
- [ ] **Step 4: Add Tailwind directives to `src/index.css`**
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [ ] **Step 5: Install and configure `vite-plugin-pwa`**
  Run: `npm install -D vite-plugin-pwa`
  Modify `vite.config.ts`:
  ```typescript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import { VitePWA } from 'vite-plugin-pwa'

  export default defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Cadence',
          short_name: 'Cadence',
          description: 'Quarterly Goal Manager',
          theme_color: '#ffffff',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        }
      })
    ]
  })
  ```
- [ ] **Step 6: Add iOS PWA meta tags to `index.html`**
  Add inside `<head>`:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Cadence">
  <link rel="apple-touch-icon" href="/pwa-192x192.png">
  ```
- [ ] **Step 7: Commit**
  `git add . && git commit -m "chore: initialize project with react, tailwind, and pwa"`

### Task 2: Storage Layer (IndexedDB)

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Install `idb-keyval`**
  Run: `npm install idb-keyval`
- [ ] **Step 2: Implement database wrapper in `src/lib/db.ts`**
  ```typescript
  import { get, set, del, clear } from 'idb-keyval';

  export const db = {
    async save(key: string, value: any) {
      await set(key, value);
    },
    async get(key: string) {
      return await get(key);
    },
    async remove(key: string) {
      await del(key);
    },
    async reset() {
      await clear();
    }
  };
  ```
- [ ] **Step 3: Create a simple test script to verify storage**
  Create `src/test-db.ts` and run with `ts-node` or via a temporary `useEffect` in `App.tsx`.
  Expected: `db.save('test', 123)` followed by `db.get('test')` returns `123`.
- [ ] **Step 4: Commit**
  `git add src/lib/db.ts && git commit -m "feat: implement indexeddb storage layer"`

### Task 3: Constants & Core Logic Hooks

**Files:**
- Create: `src/constants/prompts.ts`, `src/hooks/useQuests.ts`, `src/hooks/useReflections.ts`

- [ ] **Step 1: Define weekly prompts in `src/constants/prompts.ts`**
  ```typescript
  export const WEEKLY_PROMPTS = [
    "What is the one thing that must happen this week to feel real progress on this quest?", // Mon
    "What's a small victory from the last 24 hours that confirms you're on the right track?", // Tue
    "How is the momentum? What needs a course correction for the rest of the week?", // Wed
    "What is currently the biggest source of resistance or friction for this goal?", // Thu
    "Looking at the week as a whole, did your actions align with your success metrics?", // Fri
    "How do you actually feel about your progress right now—energized, drained, or neutral? Why?", // Sat
    "Looking at next week, what's one specific adjustment you can make to your commitments?" // Sun
  ];
  ```
- [ ] **Step 2: Implement `useQuests` hook for versioned goals**
  In `src/hooks/useQuests.ts`, implement:
  - `getQuests()`: Returns current active goals.
  - `saveQuest(id, content)`: Increments version, pushes old version to history, saves new.
  - `getQuestHistory(id)`: Returns all previous versions.
- [ ] **Step 3: Implement `useReflections` hook**
  In `src/hooks/useReflections.ts`, implement:
  - `saveReflection(questId, date, prompt, text)`
  - `getReflectionsForDate(date)`
  - `getAllReflections()`
- [ ] **Step 4: Commit**
  `git add src/constants/prompts.ts src/hooks/useQuests.ts src/hooks/useReflections.ts && git commit -m "feat: implement core business logic hooks"`

### Task 4: Base UI Layout & Navigation

**Files:**
- Create: `src/components/Layout.tsx`, `src/App.tsx`

- [ ] **Step 1: Create `Layout.tsx` for iOS safe areas**
  ```tsx
  export const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-safe pb-safe px-4">
      {children}
    </div>
  );
  ```
  Add `pt-safe` and `pb-safe` to Tailwind config or as custom CSS: `padding-top: env(safe-area-inset-top);`.
- [ ] **Step 2: Implement high-level routing/state in `App.tsx`**
  Create a simple state machine: `view: 'onboarding' | 'dashboard' | 'evolution' | 'archive'`.
- [ ] **Step 3: Commit**
  `git add src/components/Layout.tsx src/App.tsx && git commit -m "feat: implement base layout and navigation state"`

### Task 5: Sequential Onboarding

**Files:**
- Create: `src/components/Onboarding.tsx`, `src/components/QuestForm.tsx`

- [ ] **Step 1: Create `QuestForm.tsx` based on `scaffold.md`**
  Fields: `mainQuest`, `importance`, `successMetrics` (list), `commitments` (list), `excitement`.
- [ ] **Step 2: Implement `Onboarding.tsx` for sequential setup**
  - Step 1: Setup 'Life' quest.
  - Step 2: Setup 'Work' quest.
  - Step 3: Finalize and move to 'dashboard'.
- [ ] **Step 3: Commit**
  `git add src/components/Onboarding.tsx src/components/QuestForm.tsx && git commit -m "feat: implement sequential onboarding flow"`

### Task 6: Daily Dashboard & Reflection Loop

**Files:**
- Create: `src/components/Dashboard.tsx`

- [ ] **Step 1: Implement Quest Summary view**
  Show the `mainQuest` and current `version` for both Life and Work.
- [ ] **Step 2: Implement Daily Prompt logic**
  Use `new Date().getDay()` to select the correct prompt from `WEEKLY_PROMPTS`.
- [ ] **Step 3: Implement Reflection Input and Save**
  Two text areas $\rightarrow$ Save to `useReflections`.
- [ ] **Step 4: Commit**
  `git add src/components/Dashboard.tsx && git commit -m "feat: implement daily dashboard and reflection loop"`

### Task 7: Evolution Lab & Versioning

**Files:**
- Create: `src/components/EvolutionLab.tsx`

- [ ] **Step 1: Implement Version History list**
  Display all previous versions of the selected quest with `updatedAt` dates.
- [ ] **Step 2: Implement the "Update Goal" flow**
  Allow editing the current quest $\rightarrow$ call `saveQuest` $\rightarrow$ trigger version increment.
- [ ] **Step 3: Commit**
  `git add src/components/EvolutionLab.tsx && git commit -m "feat: implement quest versioning and evolution lab"`

### Task 8: Reflection Archive & Final Polish

**Files:**
- Create: `src/components/ReflectionLog.tsx`

- [ ] **Step 1: Implement chronological reflection feed**
  Fetch all reflections $\rightarrow$ group by date $\rightarrow$ display.
- [ ] **Step 2: Final UI Polish**
  Ensure buttons are large enough for touch (iOS), colors are high contrast, and fonts are readable.
- [ ] **Step 3: Commit**
  `git add src/components/ReflectionLog.tsx && git commit -m "feat: implement reflection archive and final polish"`
