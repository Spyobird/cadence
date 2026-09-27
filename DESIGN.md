# Design Spec: The Precision Chronometer

## 1. Visual Thesis
The visual identity of Cadence is grounded in the concept of a "Precision Instrument." Rather than a generic productivity app, it is designed to feel like a high-end chronometer or a professional architectural logbook. The aesthetic emphasizes precision, rhythm, and the steady pulse of a 90-day cycle.

The goal is to create a "focused void"—a dark, high-contrast environment that eliminates all distractions and centers the user's attention entirely on their two primary quests.

## 2. Design Tokens

### Palette: The Steel & Gold System
The palette avoids standard "dark mode" defaults in favor of a machined, metallic feel.

| Token | Hex | Role | Description |
| :--- | :--- | :--- | :--- |
| **Deep Obsidian** | `#0F1113` | Background | The primary void; maximum focus. |
| **Graphite Slate** | `#1E2124` | Surface | Used for cards, input fields, and containers. |
| **Silver-Mist** | `#C0C4CC` | Primary Text | High contrast but reduced glare compared to white. |
| **Steel-Gray** | `#64748B` | Secondary Text | Used for labels, metadata, and inactive states. |
| **Pulse Gold** | `#D4AF37` | Accent | The "living" color. Used for active focus, version numbers, and success states. |

### Typography: The Instrument Scale
A pairing of architectural geometry and technical precision.

- **Display (Titles):** Bold, geometric sans-serif with tight tracking. Used for the "Main Quest" titles to feel authoritative and fixed.
- **Body (Content):** Clean, neutral geometric sans-serif. Optimized for readability during reflection entries.
- **Utility (Data):** Crisp Monospace (e.g., *JetBrains Mono*). Used for all "data" points: dates, version numbers (`v1.0.2`), and the day counter (`Day 42 / 90`). This creates a "logbook" feel.

## 3. Layout & Components

### The Mirrored Balance
The Dashboard utilizes a mirrored split layout. Life and Work quests are placed side-by-side (or in balanced vertical stacks on mobile), visually reinforcing that the two spheres of life are of equal importance and should be balanced.

### The Rhythm Strip
A thin, 2px horizontal line at the very top of the viewport. A single `Pulse Gold` dot moves along this line linearly from 0 to 90, providing a constant, quiet visual of the user's position within the quarter.

### The Signature Element: The Cyclical Progress Ring
Replacing the standard linear progress bar, the 90-day block is represented as a large, elegant, thin-stroke circle.
- **Behavior:** The ring fills clockwise as the days pass.
- **Center:** The center of the ring displays the current day count in the Utility mono font.
- **Meaning:** It transforms "progress" into a "cycle," reminding the user that every quarter is a complete loop of intention and reflection.

## 4. Motion & Interaction

### The Pulse
Upon the successful submission of a daily reflection, the Cyclical Progress Ring performs a single, soft radial pulse animation. This serves as a "heartbeat" confirmation—a tactile signal that the cadence has been kept for the day.

### The Ledger Slide
Transitions between the Dashboard and the Evolution Lab use a smooth, horizontal slide animation. This mimics the physical act of turning a page in a professional ledger or a high-end planner.

## 5. UI Voice & Copy
The interface speaks in the voice of a precision tool:
- **Active Voice:** "Save version," "Check-in," "Update quest."
- **Zero Fluff:** No apologetic error messages or generic "Welcome" text.
- **Directional:** Empty states are treated as invitations to act (e.g., *"The void is empty. Define your first quest."*).
