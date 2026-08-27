# Logic Routine — Interactive Karnaugh Map Learning Tool

> **Concept-Driven Boolean Minimizer, Live Digital Logic Gate Simulator & Pedagogical Tutor**

[![Version](https://img.shields.io/badge/version-2.0.0-emerald.svg)](https://github.com/tahfimism/kmap)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Client--Side-orange.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0%20runtime-purple.svg)]()

**Logic Routine** is an open-source educational suite designed to demystify Boolean algebra and digital logic design. Running 100% client-side in the browser without server dependencies, it pairs an exact **Quine-McCluskey & Petrick's Method minimization engine** with a **live interactive circuit simulator**, **step-by-step tutorial playback**, **intelligent auto-graded practice challenges**, and **LaTeX/PNG export tools**.

---

## 🌟 Key Highlights

* 🧠 **Exact Algorithmic Minimizer**: Computes minimal **SOP** and **POS** expressions across 2, 3, 4, and 5-variable spaces ($2^N$ cells, up to 32 minterms) using Quine-McCluskey tabulation offloaded to background Web Workers.
* ⚡ **Live Logic Gate Simulator**: Real-time Manhattan $90^\circ$ circuit schematic with clickable variable switches ($A, B, C, D, E$) and live signal propagation (glowing Emerald for High, muted Slate for Low) reaching output pin $Y$.
* 🎨 **Anti-Blur Staggered Loops**: Calibrated insets ($4\text{px}, 7.5\text{px}, 11\text{px}\dots$) and dashed borders prevent overlapping loops from becoming visual blobs.
* 🎯 **Intelligent Practice Mode**: 4-pillar auto-grader (Zero cells excluded, Minterms covered, Loops maximized, Minimal loop count) with isomorphic symmetry generators (384 permutations per problem) and custom JSON PYQ loader.
* ⌨️ **Ergonomics & Accessibility**: Spatial Arrow key navigation (<kbd>&uarr;</kbd> <kbd>&darr;</kbd> <kbd>&larr;</kbd> <kbd>&rarr;</kbd>), direct cell keystrokes (`0`, `1`, `X`), and 50-step linear Undo/Redo (`Ctrl+Z` / `Ctrl+Y`).
* 📤 **Export & Sharing**: 1-click **LaTeX** equations, Quine-McCluskey tabulation coverage charts, transparent **PNG** grid downloads, and shareable **URL hash links**.
* 🌟 **Spotlight Onboarding Guide**: Interactive 5-step SVG cutout tour with smart viewport-aware popovers and replay button (`?`).

---

## 🚀 Quick Start

Open `index.html` directly in any modern browser:
```bash
git clone https://github.com/tahfimism/kmap.git
cd kmap
start index.html       # Windows
open index.html        # macOS
xdg-open index.html    # Linux
```

---

## 📚 Documentation

* 📖 **[PROJECT_PROFILE.md](PROJECT_PROFILE.md)** — Comprehensive project showcase, architecture, motivation, and benchmarks.
* 📋 **[FEATURES.md](FEATURES.md)** — Exhaustive technical breakdown of every algorithm, visual rendering engine, and feature.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
