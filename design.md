# Class Routine Dashboard: Frontend Design Specification

This document details the complete design system, UI layout mechanics, component anatomy, and motion system for the **Class Routine Dashboard**. It serves as an exact reference manual for recreating this premium, utility-driven visual identity across other projects.

---

## 1. Overall Theme & Aesthetic Philosophy
The dashboard embraces a **minimalist utility** aesthetic. The design is inspired by high-end physical hardware, editorial printing, and contemporary productivity tools (like Linear and Apple's native apps). It prioritizes **clutter reduction**, **high information density without noise**, and **single-hand mobile ergonomics**.

### The 60-30-10 Color System
To maintain visual balance, the interface adheres strictly to a **60-30-10 distribution**:
- **60% (Dominant - Backgrounds)**: Warm cream paper (`#FDFBF7`) in light mode to reduce eye strain, or pure pitch charcoal (`#121212`) in dark mode to preserve contrast and OLED efficiency.
- **30% (Secondary - Structure & Text)**: Clean white cards (`#FFFFFF` in light mode; `#1A1A1A` in dark mode) paired with crisp near-black typography (`#202020` in light mode; `#E5E5E5` in dark mode) and soft borders.
- **10% (Accent - Focus & Alerts)**: Emerald Green (`#10B981`) represents vitality, live states, active tracking, success statuses, and focal points.

---

## 2. Design Tokens

### 2.A Color Palettes

#### Default Charcoal Mode (Global/Standardized)
Used across all routines when dark mode is enabled to ensure readability and consistent contrast:
- **Background**: `#121212` (Zinc/Neutral 900 equivalent)
- **Cards**: `#1A1A1A` (Zinc 850 equivalent)
- **Borders**: `#282828` (Zinc 800 equivalent)
- **Text (Primary)**: `#E5E5E5`
- **Text (Muted/Secondary)**: `#8A8A8A`
- **Selection Highlight**: `#27272a` (Zinc 800)

#### Default Cream Mode (ECE Routine)
- **Background**: `#FDFBF7` (Warm paper tone)
- **Cards**: `#FFFFFF` (Pure white)
- **Borders**: `#E8E5DF` (Soft warm neutral)
- **Text (Primary)**: `#202020`
- **Text (Muted/Secondary)**: `#6E6A64`
- **Selection Highlight**: `#E5E5E5`

#### Dynamic Custom Mode (Example: EWU/DSA Lavender Theme)
Light mode colors can be bound to CSS variables and overridden per routine configuration:
- **Background (`--cream-bg`)**: `#EAE2F8` (Soft lavender)
- **Cards (`--cream-card`)**: `#FFFFFF` (Pure white, optionally `#DAB2F2` for saturated themes)
- **Borders (`--cream-border`)**: `#D1C4E9` (Medium lavender)
- **Text (`--cream-text`)**: `#33185C` (Deep eggplant purple)
- **Text Muted (`--cream-muted`)**: `#584949`

#### Functional Accents
- **Primary Action / Live**: Emerald (`#10B981`)
  - Live progress bar, live pulse dot, success alerts, and primary buttons.
- **Warning / Destructive**: Rose (`#F43F5E`)
  - Absent alerts, deleted items, validation errors.
- **Pending / Notes**: Amber (`#F59E0B`)
  - Overlap warnings, special notes.
- **Topic Tags**: Indigo (`#6366F1`)
  - Course-specific task tags.

---

### 2.B Typography
- **Primary Font**: `Inter` (sans-serif) loaded via Google Fonts.
- **Font Smoothing**: `-webkit-font-smoothing: antialiased` enabled globally to maintain thin, crisp letterforms.
- **Scale and Hierarchy**:
  - **Header Titles**: `text-xl` (`1.25rem` / `20px`), `font-bold`, `tracking-tight`
  - **Section Headings**: `text-base` (`1rem` / `16px`), `font-extrabold`, `leading-tight`
  - **Body Text**: `text-sm` (`0.875rem` / `14px`), `font-medium`, `leading-relaxed`
  - **Metadata & Labels**: `text-xs` (`0.75rem` / `12px`), `font-semibold` / `font-bold`
  - **Micro-labels**: `text-[10px]` or `text-[9px]`, `font-extrabold`, `uppercase`, `tracking-widest` (e.g., tags, periods, countdown indicators)

---

### 2.C Shadows
- **Card Default / Rest State**: No shadow, defined purely by `1px` solid border (`border-cream-border` / `border-charcoal-border`) to ensure a flat, structured grid.
- **Card Hover State**: Elevation shadow to simulate lifting.
  - Light mode: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)` (`shadow-md` equivalent).
  - Dark mode: No fuzzy black drop shadows. Border color thickens slightly, or a very faint tint matches the card border.
- **Modal Elevation**: High elevation shadow to stand out from background.
  - `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)` (`shadow-2xl` equivalent).

---

### 2.D Transitions & Timing Functions
- **Global Theme Change**: Custom CSS rules handle smooth transitions when switching dark/light themes.
  ```css
  body, header, main, footer, div, section, p, h1, h2, h3, span, button, nav, svg {
      transition-property: background-color, border-color, color, fill, stroke, box-shadow, transform;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 350ms;
  }
  ```
- **Interactive States**: Standard transition duration for hover and active transitions is `220ms` to `250ms`.
  - Schedule cards use a custom spring-like timing function: `transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, border-color 0.22s ease;`

---

## 3. Responsive Layout Framework

### 3.A Centered Viewport Containment
The layout is optimized for mobile usage but scales gracefully to desktop.
- The root container uses `max-w-3xl` (`768px`) with `w-full mx-auto px-6` to ensure it is centered and bounded on large screens, with margin-safe gutters on mobile.

```
+------------------------------------------+
|                 Header                   |
+------------------------------------------+
|          Intelligence Banner             |
+------------------------------------------+
|            Quick Dashboard               |
+------------------------------------------+
|                 Tabs                     |
+------------------------------------------+
|                                          |
|                Timeline                  |
|                                          |
+------------------------------------------+
|                 Footer                   |
+------------------------------------------+
```

### 3.B Mobile-First Header Structure
To support ergonomic one-handed use, the header layout adapts responsively:
- **On Mobile Devices (`< 768px`)**:
  - Row 1: The App Logo and control toggles (View Mode, Notification Bell, Theme Switcher, Settings gear) align horizontally.
  - Row 2: The active routine title and subtitle sit *below* the toggles, making the title easy to tap for the settings easter egg.
- **On Desktop Screens (`>= 768px`)**:
  - The header behaves as a single row. The App Logo and Title sit on the far left, while all controls group together on the right.

---

## 4. UI Component Anatomy & Styles

### 4.A Daily View Class Card
The central element of the interface. Displays academic schedule data cleanly.

```
+-----------------------------------------------------------+
| [ TYPE BADGE ]  ECE 2101 • Electronic Devices      08:50  |
|                 Instructors: AT | Group A           to    |
|                                                    09:40  |
| ============================== (Progress Bar)             |
| * Ongoing (20m elapsed)                 15m remaining     |
+-----------------------------------------------------------+
```

- **Container**: `div` with class `.schedule-card`
  - Tailwind styling: `bg-cream-card dark:bg-charcoal-card border border-cream-border dark:border-charcoal-border rounded-xl p-5 cursor-pointer`
- **Header Section**:
  - **Type Badge (Sessional)**: `text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded`
  - **Type Badge (Theory)**: `text-neutral-700 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded`
  - **Course Title**: `text-sm font-bold text-cream-text dark:text-charcoal-text leading-tight`
  - **Time Range**: `text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-tight font-sans text-right shrink-0`
- **Instructor / Group Row**:
  - Text format: `Instructors: A &bull; B | Group A/B` (Group in semi-bold amber text: `text-amber-600 dark:text-amber-400`).
- **Live / Ongoing Class State**:
  - Highlighted border: `border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/5 ring-1 ring-emerald-500/10 shadow-md`
  - **Live Indicator**: A pulsing green dot (`bg-emerald-500 pulse-live`) placed next to the course name.
  - **Progress Bar**: `w-full bg-neutral-200/50 dark:bg-neutral-800/80 rounded-full h-1 overflow-hidden mt-3.5`. Inner bar is `bg-emerald-500 h-full rounded-full` representing elapsed progress.
  - **Elapsed Metadata**: Row showing `Ongoing (Xm elapsed)` and `Ym remaining` in `text-[10px] font-semibold text-emerald-600 dark:text-emerald-400`.
- **Card Hover Effect**:
  - `transform: translateY(-2px) scale(1.015);`
  - Adds a subtle shadow (`shadow-md`).

---

### 4.B Class Break Separator
Inserted dynamically between class cards to show gaps in the schedule.
- **Layout**: Dashed line with a center-aligned indicator tag.
- **Divider Lines**: `flex-grow border-t border-dashed border-cream-border/60 dark:border-charcoal-border/50`
- **Break Tag**: `px-3 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-cream-bg dark:bg-charcoal-bg`
  - Text format: `☕ Xm Break` or `☕ Xh Ym Break`.

---

### 4.C Countdown / Intelligence Banner
Tells the student the exact status of the academic day.
- **Container**: `p-4 rounded-xl border border-cream-border dark:border-charcoal-border bg-neutral-50/40 dark:bg-neutral-900/20 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex flex-row items-center justify-between gap-2 shadow-sm`
- **Visuals**: Incorporates tiny status icons (e.g., green dot, coffee cup, clock, calendar) next to the text.
- **Dismiss Button**: Small cross button (`text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300`) to easily reclaim space.

---

### 4.D Weekly Grid View Row
Optimized grid representation for visual planning without layout breaks on mobile screens.
- **Row Container**: Flexbox on desktop, vertical list on mobile.
  - Tailwind styling: `flex flex-col md:flex-row md:items-center gap-4 md:gap-6 py-4 border-b border-cream-border/40 dark:border-charcoal-border/30 last:border-0`
  - Active/Today Row: Highlighted background and border (`bg-neutral-100/30 dark:bg-neutral-900/10 border-neutral-300/80 dark:border-neutral-850 py-4 px-4 rounded-2xl`).
- **Day Label Column**: Width restricted to `w-full md:w-32 shrink-0`.
  - Sunday to Thursday labels styled in `font-extrabold text-sm text-cream-text dark:text-charcoal-text`.
  - "Starts at" sub-label: `text-[10px] font-bold text-cream-muted dark:text-charcoal-muted mt-0.5`.
- **Horizontal Scrolling Cards Container**:
  - Tailwind styling: `flex gap-3 overflow-x-auto scrollbar-none pb-2 flex-nowrap -mx-6 px-6 md:mx-0 md:px-0`
  - Let's users swipe horizontally to browse classes for that day.
- **Weekly Card**: Highly condensed version of the daily card.
  - Width: `w-[130px] md:w-[145px] min-h-[85px] shrink-0`
  - Text: Displays course code only in heavy type (`text-xs font-extrabold`). Room numbers, sessional names, and titles are hidden.
  - Footer details: Shows starts-at time and instructor acronyms truncated cleanly.

---

### 4.E Modals (Anatomy & Overlay)
Modals display class details, setting menus, and synchronization keys.

```
+------------------------------------------+
|  [Overlay Backdrop blur(8px)]            |
|                                          |
|         +----------------------+         |
|         | Detail Modal         |         |
|         |                      |         |
|         | Course Code & Name   |         |
|         | Time & Room Info     |         |
|         | Instructor List      |         |
|         | Personal Notes (Text)|         |
|         | Attendance Tracker   |         |
|         +----------------------+         |
|                                          |
+------------------------------------------+
```

- **Backdrop Overlay**: `.modal-backdrop`
  - Tailwind styling: `absolute inset-0 bg-neutral-900/60 dark:bg-black/80`
  - Blur: `backdrop-filter: blur(8px); transition: opacity 0.25s ease-out;`
- **Modal Content Card**: `.modal-content`
  - Tailwind styling: `relative bg-cream-card dark:bg-charcoal-card border border-cream-border dark:border-charcoal-border rounded-2xl w-full max-w-md shadow-2xl p-6 overflow-hidden`
  - Transition animations: Uses scale and opacity change (`transform scale-95 opacity-0 transition-all duration-200`).
- **Interactive Details**:
  - Detail lists (Time, Location) use custom icons in a container `p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400`.
  - **Personal Notes Textarea**: Styled in `w-full h-16 p-2 text-xs rounded-lg border border-cream-border dark:border-charcoal-border bg-neutral-50 dark:bg-neutral-900/50 text-cream-text dark:text-charcoal-text focus:ring-1 focus:ring-emerald-500 transition resize-none`.
  - **Attendance Tracker**: Present/Absent/Clear buttons styled using border outlines (`border-emerald-500/50`, `border-rose-500/50`, `border-neutral-300`).

---

### 4.F Student Dashboard (Off-Canvas / Toggle Section)
An secondary productivity interface for managing tasks, makeup classes, and analytics.
- **Entry CTA**: Styled as a high-contrast banner (`bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-white dark:text-emerald-400 border border-transparent dark:border-emerald-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer`).
- **Task List (To-Do)**:
  - Input fields and select dropdowns: Rounded-lg, bordered inputs (`bg-white dark:bg-charcoal-card border border-cream-border dark:border-charcoal-border text-sm`).
  - Active inputs highlight green: `focus:outline-none focus:border-emerald-500`.
  - Add button: `bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg px-5 py-2.5 transition`.
- **Attendance Analytics Tracker**:
  - Displays circular progress stats or list items detailing overall class percentages.

---

### 4.G Toast Notification System
Non-blocking notifications that slide in from the bottom right.
- **Container**: `fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none`
- **Toast Block**: `px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 toast-enter pointer-events-auto`
  - Info / Success state: `bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-900`
  - Error state: `bg-rose-500 text-white`
- **Icon**: Checkmark or Exclamation svg icon placed next to text.

---

## 5. Interaction & Motion System

### 5.A Navigation & Tab Animations
When switching day tabs or changing view modes, a reflow tick is executed to restart CSS fade-in transitions.
- **Fade-in CSS**:
  ```css
  @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
      animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  ```
- **Reflow Trick (JS)**:
  ```javascript
  const timeline = document.getElementById('classes-timeline');
  timeline.classList.remove('animate-fade-in');
  void timeline.offsetWidth; // Force layout reflow
  timeline.classList.add('animate-fade-in');
  ```

---

### 5.B Modal Transitions
Modals animate dynamically when toggled using standard classes in `style.css`:
- **Activating Modal**: Add `.active` class to container, stripping `.hidden`.
- **Backdrop Animation**: Opacity changes from `0` to `1` over `0.2s`.
- **Content Card Animation**: Card scale animates from `scale-95` to `scale-100` and opacity shifts from `0` to `1`.
  - Timing function: `cubic-bezier(0.34, 1.56, 0.64, 1)` (creates a subtle spring bounce effect on open).

---

### 5.C Mobile Swipe Gestures
Powered by **Hammer.js** to handle navigation fluidly:
- **Left Swipe**: Switches tab to the next weekday (Sunday -> Monday -> Tuesday -> Wednesday -> Thursday).
- **Right Swipe**: Switches tab to the previous weekday.
- Swiping behaves smoothly without affecting vertical scrollability, maintaining default PWA swipe expectations.

---

### 5.D Theme Toggle Rotation
- Sun/Moon SVG icons rotate `360deg` and scale down during execution to signify a theme shift.
- Class: `.theme-icon` transition: `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);`.
- Rotated class: `.theme-icon-rotate` transforms to `rotate(360deg) scale(0.9)`.

---

### 5.E Easter-Egg Modal Trigger
- Clicking the Header Title (`#routine-title`) **three times quickly (within 1.0 second)** opens the settings selection panel.
- Elements have `select-none` styling to prevent text highlights during the click burst.

---

## 6. Guidelines for Porting This Design
To apply this exact styling system to a different project (e.g., a **Task Management Board** or **Habit Tracker**):

1. **Keep the Layout Restrained**: Group everything within a `max-w-3xl` container. Avoid wide layouts; make it feel like a mobile app even on desktops.
2. **Utilize 1px Borders**: Define elements using thin, solid, low-opacity borders (`border-neutral-200` or `border-neutral-800`). Avoid shadows on static elements, and only use shadows on hover or modals.
3. **Use the 60-30-10 Palette**: Lock colors to dynamic CSS custom variables. Default background to warm paper (`#FDFBF7`) or OLED black (`#121212`), cards to solid white/charcoal, and use exactly one vibrant accent (like Emerald `#10B981`) for alerts, live indicator bars, and active tabs.
4. **Ergonomic Controls**: Keep all interactive controls (tabs, toggle buttons, forms) within thumb reach. For mobile viewports, stack layout headers so title blocks sit below buttons.
5. **Interactive Feedback**:
   - Live countdowns should have progress bars and a pulsing glow element (`pulse-live`).
   - Clicking cards should open clean backdrop-filter blur modals using spring timings (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
   - Swiping laterally should slide through timeline sections.
   - Interactive hover cards should translate up `-2px` and scale up by `1.5%`.
6. **Focus Ring Uniformity**: Eliminate default browser outlines. Use custom rings:
   `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50`.
