# DESIGN.md — DevHub Visual & Identity Direction

## 1. Product Context & Target Audience

- **Product**: DevHub (Personal Developer Productivity & Engineering Operations Cockpit).
- **Domain**: Automated Taiga task capture, GitLab commit & MR analytics, engineering workload tracking, and AI-assisted task synthesis.
- **Audience**: Software engineers, tech leads, and product owners seeking clear, dense, functional instrumentation of daily developer work.
- **Design Personality**: Focused, clean, approachable, high-precision. Inspired by modern cloud cockpits with structured cards, serene light tones, and tactile data indicators.

## 2. Liveliness Dials

- **ENERGY**: `2` (Balanced. Crisp contrast, bright clean surfaces, vibrant royal blue active elements, and distinct pastel category accents without sensory overload).
- **RHYTHM**: `2` (Structured. Symmetrical service cards with circular telemetry gauges, a colorful category row, and a clean tabular task stream).
- **MOTION**: `1` (Subtle. Functional hover states, smooth progress ring animations; no infinite pulsing or distracting floating animations).

## 3. Curated Color System (Light Cloud Cockpit)

- **Canvas Background**: `#f0f4f9` / `#eef2f7` (Serene, soft slate-blue backdrop).
- **Surface Cards**: `#ffffff` (Solid clean white surfaces with high-contrast text rendering).
- **Primary Brand / Active Accent**:
  - `Royal Ocean Blue` (`#1977f3` / `hsl(214 90% 53%)`): Primary navigation rail, active service card, primary CTAs, progress indicators.
  - `Active Selection Highlight`: `#eaf3ff` (Soft sky blue background tint for selected table rows and active nav items).
- **Card Borders**: `1px solid #e2e8f0` (Subtle, crisp separation, never glowing borders).
- **Elevation / Shadows**: `0 4px 20px -2px rgba(27, 46, 94, 0.05)` (Subtle, soft elevation to ground cards).
- **Neutral Typography Palette**:
  - Primary Text: `#1e293b` (Slate 800, WCAG AAA contrast >= 12.6:1 on white).
  - Secondary Text: `#64748b` (Slate 500, WCAG AA contrast >= 4.6:1 on white).
  - Muted / Borders: `#94a3b8` / `#cbd5e1` (Slate 400/300).
- **Semantic Status Signals & Category Chips**:
  - `Violet`: `#8b5cf6` (Smart Tasks / AI synthesis).
  - `Coral Red`: `#ef4444` (GitLab Commits & Urgent items).
  - `Amber / Orange`: `#f97316` (Pull Requests & Pending reviews).
  - `Sky Blue`: `#06b6d4` (Sprint & Milestones).
  - `Slate`: `#64748b` (Workload & Capacity).
  - `Royal Blue`: `#3b82f6` (Reports & Documentation).
  - `Emerald`: `#10b981` (Connected integrations & Completed tasks).

## 4. Typography Standards

- **UI Sans**: `Plus Jakarta Sans` / `system-ui` for crisp hierarchy and legible small labels.
- **Code & Metric Mono**: `JetBrains Mono` / `ui-monospace` for commit SHAs, issue IDs (`#123`), and numeric counters.
- **Rules**:
  - No decorative uppercase headers with extreme tracking unless functional category headers.
  - Never place redundant category pill badges immediately above headings.

## 5. Craftsmanship & Quality Constraints

- **Zero Em Dashes (`—`)**: Use colons, commas, hyphens, or parentheses for punctuation.
- **No Neon Blob Wallpapers**: Replace multi-colored ambient radial glowing orbs with clean light canvas surfaces.
- **Glassmorphism Dose Cap**: Restrict `backdrop-filter: blur` to floating toast notifications or modal overlays. Main cards and sidebars use solid clean surfaces.
- **Strict 44px Mobile Tap Targets**: All buttons, links, and selectable rows must maintain at least 44px touch targets on mobile viewports.
- **Authentic Data Only**: Every number displayed reflects actual synchronized telemetry.
