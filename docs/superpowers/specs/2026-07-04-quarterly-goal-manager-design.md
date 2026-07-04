# Design Spec: Quarterly Goal Manager (Cadence)
Date: 2026-07-04
Status: Draft

## 1. Overview
Cadence is a minimal Progressive Web App (PWA) designed for iOS to help the user maintain alignment and focus on two primary quarterly goals: one for Life and one for Work. The app facilitates a daily check-in habit through rotating introspective prompts and allows for the iterative refinement of goals over a 90-day block.

### Core Goals
- Reduce friction for daily reflection.
- Maintain a high level of focus (max 2 quests).
- Track the evolution of goals based on real-world data points.

## 2. Architecture & Technical Stack

### Tech Stack
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS (Mobile-first)
- **Storage:** IndexedDB (via `idb-keyval` for a lean API)
- **PWA:** Web App Manifest + Service Worker for iOS "Add to Home Screen" and offline capability.

### Data Model

#### Quests
Stored as an object keyed by `id` ('life' or 'work').
```typescript
interface Quest {
  id: 'life' | 'work';
  version: number; // Increments on every update
  content: {
    mainQuest: string;       // The "X"
    importance: string;      // The "Y"
    successMetrics: string[]; // Observable results
    commitments: string[];    // Steps to accomplish
    excitement: string;      // The "Z"
  };
  updatedAt: number; // Timestamp
}
```

#### Reflections
Stored as a collection of entries.
```typescript
interface Reflection {
  id: string; // UUID
  questId: 'life' | 'work';
  date: string; // YYYY-MM-DD
  prompt: string;
  text: string;
  createdAt: number; // Timestamp
}
```

## 3. User Flow & Components

### 3.1 Onboarding (Quarterly Setup)
- **Trigger:** No quests found in storage or a new 90-day cycle is initiated.
- **Flow:** Sequential setup. The user is prompted to create the 'Life' quest first, followed by the 'Work' quest.
- **Form:** Each form follows the `scaffold.md` structure.

### 3.2 Daily Dashboard (Home)
- **Quest Summary:** A condensed view showing the `mainQuest` and `successMetrics` for both Life and Work.
- **Daily Reflection:** 
  - The app determines the day of the week.
  - Surfaces the corresponding prompt for Life and Work.
  - Two text areas for input.
- **Action:** A single "Check-in" button saves both reflections to IndexedDB.

### 3.3 Evolution Lab (Goal Updates)
- **View:** Displays current active quests.
- **Version History:** A list of previous quest versions with timestamps.
- **Update Action:** Users can edit the current quest. Saving creates a new version rather than overwriting the previous one.

### 3.4 Reflection Archive
- A chronological feed of all past reflections, filtered by quest or date.

## 4. The Weekly Reflection System

Prompts rotate based on the day of the week. These are applied separately to both the Life and Work quests.

| Day | Theme | Prompt |
| :--- | :--- | :--- |
| **Monday** | Intention | "What is the one thing that must happen this week to feel real progress on this quest?" |
| **Tuesday** | Small Wins | "What's a small victory from the last 24 hours that confirms you're on the right track?" |
| **Wednesday** | Mid-week Check-up | "How is the momentum? What needs a course correction for the rest of the week?" |
| **Thursday** | Friction | "What is currently the biggest source of resistance or friction for this goal?" |
| **Friday** | Weekly Review | "Looking at the week as a whole, did your actions align with your success metrics?" |
| **Saturday** | Emotional State | "How do you actually feel about your progress right now—energized, drained, or neutral? Why?" |
| **Sunday** | Looking Forward | "Looking at next week, what's one specific adjustment you can make to your commitments?" |

## 5. Implementation Notes

### iOS PWA Optimization
- Include `<meta name="apple-mobile-web-app-capable" content="yes">`.
- Set a specific `apple-touch-icon` to ensure it feels like a native app.
- Use `safe-area-inset` CSS variables to handle the iOS notch/home indicator.

### Versioning Logic
- When `updateQuest` is called:
  1. Retrieve current quest.
  2. Push current quest to a `history` array.
  3. Increment `version`.
  4. Save new quest object.
