# Logic Routine (K-Map Learning Tool) — Complete Feature & Technical Specification

> **Logic Routine** is an interactive, concept-driven Karnaugh Map minimizer, pedagogical boolean tutor, and digital logic simulator. It runs entirely client-side with zero external server dependencies, combining exact mathematical minimization algorithms with live hardware-level circuit simulation.

---

## 📑 Table of Contents
1. [Core Algorithmic Engines](#1-core-algorithmic-engines)
2. [Interactive Visual & Rendering Systems](#2-interactive-visual--rendering-systems)
3. [Live Logic Gate Circuit Simulator](#3-live-logic-gate-circuit-simulator)
4. [Multi-Modal Inputs & Bi-Directional Synchronization](#4-multi-modal-inputs--bi-directional-synchronization)
5. [Practice Mode, Pedagogical Challenges & Auto-Grader](#5-practice-mode-pedagogical-challenges--auto-grader)
6. [Tutor Walkthrough & Step-by-Step Playback](#6-tutor-walkthrough--step-by-step-playback)
7. [Exporters, URL Serialization & Data Portability](#7-exporters-url-serialization--data-portability)
8. [Ergonomics, Keyboard Navigation & Onboarding Guide](#8-ergonomics-keyboard-navigation--onboarding-guide)
9. [Architecture, State Engine & Design Tokens](#9-architecture-state-engine--design-tokens)

---

## 1. Core Algorithmic Engines

### 1.1. Quine-McCluskey Tabulation Algorithm
* **Bitwise Distance-1 Grouping**: Systematically groups minterms by Hamming weight (number of 1s) and iteratively merges terms differing by exactly one bit into implicants with dashes (`-`).
* **Prime Implicant (PI) Extraction**: Recursively identifies all unmergeable maximal consensus terms across $2$, $3$, $4$, and $5$ variable spaces ($2^N$ cells, up to 32 minterms).
* **Essential Prime Implicant (EPI) Isolation**: Builds a coverage matrix of minterms vs. prime implicants; extracts all essential implicants uniquely covering at least one minterm.
* **Petrick's Method / Branching Minimal Cover Solver**: Evaluates product-of-sums boolean consensus across remaining non-essential minterms to select the minimal number of prime implicants with the fewest total literals.

### 1.2. Dual Optimization Modes (SOP & POS)
* **Sum of Products (SOP)**: Simplifies logic $1$s and utilizes Don't-Cares ($X$) to form maximal product terms ($Y = AB + \overline{C}D$).
* **Product of Sums (POS)**: Inverts optimization logic to cover logic $0$s while leveraging Don't-Cares, producing simplified maxterm products ($Y = (A + B)(\overline{C} + D)$).

### 1.3. Web Worker Asynchronous Dispatcher
* **Threaded Computation** (`js/solver-worker.js`): Offloads large QM tabulations and Petrick expansions into a background Web Worker thread to prevent UI micro-stutters.
* **Instantaneous Fallback Engine**: If the local sandbox or `file://` protocol restricts Web Worker initialization, the engine transparently executes synchronously without throwing errors or breaking state.

### 1.4. Isomorphic Gray-Code Challenge Generation
* **Mathematical Symmetry Mapping**: Preserves Gray-code rectangular adjacency while generating 384 distinct problem variants per template using coordinate permutations and XOR bit-inversion masks:
  $$\text{new\_idx} = \text{Permute}(\text{idx} \oplus \text{invertMask})$$

---

## 2. Interactive Visual & Rendering Systems

### 2.1. Staggered SVG Implicant Loop Overlays
* **Anti-Blur Incremental Offsets**: When multiple loops overlap on the same cells, the renderer applies incremental insets ($4\text{px}, 7.5\text{px}, 11\text{px}, \dots$) to each loop rect. This eliminates blurry, indistinguishable color blobs and keeps every distinct loop boundary crisp.
* **Toroidal Wrap-Around Rendering**: Loops that wrap across outer borders (e.g. columns $0$ and $3$, or 4-corner groups $m_0, m_2, m_8, m_{10}$) render with clean dashed borders (`stroke-dasharray="6,4"`).
* **Multi-Subgrid 5-Variable Mapping**: For 5-variable maps ($N=5$), the renderer splits into two linked subgrids ($A=0$ and $A=1$) and draws cross-grid 3D volumetric loops across both planes simultaneously.

### 2.2. Dynamic Focus Isolation
* **Hover Dimming**: Hovering over an expression term in the output card, a tutorial explanation card, or a loop item dims all non-target loops to **12% opacity** while highlighting the target loop with elevated stroke width and fill brightness.

### 2.3. Tiled Wrap-Around View
* **Infinite Cylindrical / Toroidal Inspection**: Renders a 9-block ($3\times 3$) repeated tiling of the K-map grid, demonstrating why edge cells and corner cells are physically contiguous in Boolean space.

### 2.4. Fullscreen Pattern Viewer
* **Modal Grid Expansion**: Expands maps into an unobstructed full-window modal view with scaled cell layouts for large classroom demonstrations.

---

## 3. Live Logic Gate Circuit Simulator

### 3.1. Interactive Signal Rail Switches
* **Clickable Variable Toggles**: Variable inputs ($A, B, C, D, E$) on the circuit schematic function as interactive switches. Clicking any switch toggles its input logic level ($1$ vs $0$).

### 3.2. Real-Time Signal Propagation
* **Live Wire Color Dynamics**:
  - **High ($1$)**: Vibrant glowing Emerald (`#10B981`).
  - **Low ($0$)**: Muted Charcoal / Slate (`#6E6A64`).
* **Gate Logic Computation**:
  - Automatically calculates inverted rails ($\overline{A}, \overline{B}, \dots$) through NOT gates.
  - Computes multi-input AND / OR gates live to display true intermediate outputs and the final output pin $Y$.

### 3.3. Orthogonal Manhattan Signal Routing
* **Strict $90^\circ$ Channels**: Gate interconnects and bus lines follow clean Manhattan orthogonal trajectories to prevent wire crossovers and visual confusion.

---

## 4. Multi-Modal Inputs & Bi-Directional Synchronization

1. **Interactive K-Map Grid**: Click cells or drag-select to cycle states: $0 \to 1 \to X \to 0$.
2. **Keystroke Direct Entry**: Hover over any cell and press `0`, `1`, or `X`/`x` on the keyboard to set values instantly.
3. **Spatial Keyboard Navigation (a11y)**:
   - Use <kbd>&uarr;</kbd> <kbd>&darr;</kbd> <kbd>&larr;</kbd> <kbd>&rarr;</kbd> to navigate focus between adjacent cells.
   - High-contrast focused cell ring (`ring-2 ring-accent`).
   - Press <kbd>Space</kbd> or <kbd>Enter</kbd> to cycle states.
4. **Truth Table Sync**:
   - Full truth table with toggles for every input row.
   - **Row-to-Cell Hover Sync**: Hovering over any row in the truth table highlights the corresponding K-map cell and vice-versa.
5. **Minterm & Maxterm List Input**:
   - Supports comma-separated and space-separated formats for active terms and don't-cares ($\Sigma m(0, 1, 4, 5) + d(2, 6)$ or $\Pi M(2, 3) + D(6)$).
6. **Boolean Algebraic Expression Parser**:
   - Real-time parser supporting standard Boolean expressions (e.g., `A'B + BC'D`, `~A & B | C`, $\overline{A}B$, implicit multiplication).

---

## 5. Practice Mode, Pedagogical Challenges & Auto-Grader

### 5.1. Concept-Targeted Challenge Generators
* **Easy (Adjacency)**: Basic 2, 3, and 4-variable adjacent pairs and quads.
* **Medium (Edge Wrapping)**: Toroidal wrap-around loops and 4-corner groupings ($m_0, m_2, m_8, m_{10}$).
* **Medium (Don't-Care Guide)**: Strategic inclusion of $X$ cells to double group sizes while rejecting useless don't-cares.
* **Hard (Redundancy Check - Default)**: Overlapping prime implicants where naive greedy grouping creates redundant, suboptimal loops.
* **Preset PYQ Problems**: Curated collection of historical Previous Year Examination questions.
* **Custom PYQ JSON Uploader**: Load external JSON files of coursework and exam questions.

### 5.2. Drag-to-Select Grouping & Verification
* Drag across cells to draw bounding boxes. Validates power-of-2 dimensions ($1, 2, 4, 8, 16$) and rectangular geometry in real time.
* Real-time loop feedback (Amber for valid, Rose for invalid non-power-of-2).

### 5.3. Practice Mode Undo & Redo Engine
* Built-in snapshot history for Practice Mode: pressing `Ctrl+Z` / `Ctrl+Y` undos and redos cell selections, loop additions, and loop deletions.

### 5.4. Comprehensive Practice Scorecard Modal
* **Auto-Grader Checklist**:
  1. *Zero Cells Excluded*: Verifies no $0$ cells are grouped.
  2. *Minterm Coverage*: Verifies all $1$s are completely covered.
  3. *Maximized Loops*: Checks that each loop is prime and expanded to its largest valid power-of-2 size.
  4. *Minimal Loop Count*: Confirms no redundant loops exist.
* **Side-by-Side Comparison**: Renders the student's submitted loops side-by-side with the mathematically optimal solution map.
* **Viewport Clamped & Backdrop Dismissal**: Max-height constrained (`88vh`) with scrollable body; closes on backdrop click or <kbd>Escape</kbd>.

---

## 6. Tutor Walkthrough & Step-by-Step Playback

### 6.1. Pedagogical Step Breakdown Cards
* Identifies Essential Prime Implicants and highlights the "unique minterms" that made them essential.
* Identifies non-essential Prime Implicants and explains how Petrick's method or minimal coverage covers remaining minterms.
* Formats algebraic literal terms with variable consensus breakdown (e.g. "$A$ is eliminated because it changes from $0$ to $1$").

### 6.2. Interactive Timeline Playback Player
* **Timeline Controls**: `⏮ Prev`, `▶ Play / ⏸ Pause`, `Next ⏭`, and `All`.
* **Step-by-Step Implicant Animation**: Progressively renders each implicant loop on the K-map grid step-by-step so students can visualize the grouping order.

---

## 7. Exporters, URL Serialization & Data Portability

### 7.1. LaTeX Exporter
* Generates clean LaTeX code for minimized formulas (using `\overline{A}`, `\begin{equation}`, etc.).
* Formats complete Quine-McCluskey prime implicant coverage tables in LaTeX tabular format.
* Copies instantly to clipboard with an animated toast notification.

### 7.2. High-Resolution PNG Exporter
* Rasterizes the active K-map grid onto an HTML5 canvas and triggers a direct PNG download for student lab reports and presentations.

### 7.3. Bi-Directional URL State Sharing
* Serializes map size, cell values, and expression type into the browser URL hash:
  `#n=4&data=10010110X0101001&type=SOP`
* Pasting or bookmarking the link restores the exact state automatically on startup.

---

## 8. Ergonomics, Keyboard Navigation & Onboarding Guide

### 8.1. Interactive Spotlight Onboarding Tour (`js/tour.js`)
* **SVG Cutout Spotlight**: Dims the background (`rgba(15, 15, 18, 0.65)`) and highlights target elements with a rounded, spring-animated glowing border.
* **Smart Placement Engine**: Automatically positions popovers (`bottom`, `top`, `left`, `right`) based on viewport space and scroll position.
* **5-Step Curated Tour**: Guides first-time visitors through Grid interactions, Inputs, Tutor Walkthrough, Circuit Simulator, and Practice Mode.
* **Non-Intrusive**: Dismisses on `Skip`, `✕`, clicking backdrop, or pressing <kbd>Escape</kbd>. Stored in `localStorage` to appear once, with a replay button (`?`) in the header.

### 8.2. Linear History Engine (50-Step Linear Undo/Redo)
* Tracks all state modifications in linear undo/redo stacks.
* Supported via UI toolbar buttons and standard keyboard shortcuts: `Ctrl+Z` / `Cmd+Z` (Undo), `Ctrl+Y` / `Cmd+Shift+Z` (Redo).

---

## 9. Architecture, State Engine & Design Tokens

### 9.1. Modular Client-Side Architecture
```
/
├── index.html            # Main semantic HTML5 markup & layout
├── package.json          # Optional Tailwind CSS CLI compilation setup
├── tailwind.config.js    # Custom color tokens, font families, and spring curves
├── js/
│   ├── state.js          # Central observable state store with undo/redo & URL hash
│   ├── solver.js         # Quine-McCluskey solver & Web Worker fallback dispatcher
│   ├── solver-worker.js  # Dedicated background Web Worker for tabulation
│   ├── kmap.js           # Spatial navigation, keystroke listener & DOM grid generator
│   ├── svg.js            # Staggered loop insets, dashed borders & focus isolation
│   ├── circuit.js        # Interactive logic gate schematic & signal simulator
│   ├── tutorial.js       # Step-by-step breakdown & playback timeline controller
│   ├── practice.js       # Practice generator, auto-grader, drag-selector & modal
│   ├── problems.js       # Curated default PYQ problem dataset
│   ├── export.js         # LaTeX generator, QM table exporter, PNG exporter & toast
│   ├── tour.js           # Spotlight cutout onboarding tour & popover engine
│   ├── inputs.js         # Truth table, minterm list & expression parser sync
│   ├── tiled.js          # 3x3 infinite toroidal wrapped view renderer
│   ├── ui.js             # Formula renderer & focus isolation event bindings
│   └── app.js            # Main bootstrap orchestrator & event bus
```

### 9.2. Design System & Theme Palette
* **Dark Mode Default**: Clean `#121212` background, `#1A1A1A` card surfaces, and `#282828` border accents.
* **Cream Light Mode**: `#FDFBF7` background, `#FFFFFF` cards, and `#E8E5DF` borders.
* **Accent Emerald**: `#10B981` with hover `#059669` and glow effects.
* **Spring Timing**: Hardware-accelerated cubic-bezier curves (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
