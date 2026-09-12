# Aven

**Aven** is a unified Academic Operating System for students — one place to manage subjects, track study time, calculate weighted grades, and keep interactive study plans, all built around a single core entity (**Subject**) that every feature links back to.

🔗 **Live app:** [aven-academicos.vercel.app](https://aven-academicos.vercel.app)

---

## ✨ Features

- **Subjects Dashboard** — enrolled subjects at a glance, with study time, grade standing, and study plan status per subject. Grid/list views, year-level filtering, and bulk end-of-semester archiving.
- **Tracker** — a fixed-height study dashboard combining a Pomodoro timer (modeled closely on Pomofocus), manual session logging, a weekly study-hours chart, per-subject time breakdown, milestone progress, an activity heatmap, and full session history.
- **Grades** — weighted grade calculator by category (Midterm / Final / Overall Composite), drag-and-drop category reordering, per-subject grading scale customization, and a live overview panel showing GWA, subject standings, and recent activity.
- **Study Plans** — upload or paste interactive HTML study plans, rendered securely in a sandboxed iframe with auto-saving progress (checkboxes, quiz answers, etc.).
- **Profile** — a personal academic snapshot: cumulative GWA, total study time, streaks, a 6-month study trend, subject time breakdown, and a merged activity feed.
- **Multiple themes** — light/dark variants across several color themes, all built on top of a consistent design token system.
- **Settings** — grading scale customization, account management, and data import/export (JSON, Excel).

---

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla JavaScript (no framework), [Vite](https://vitejs.dev/) for bundling |
| Routing | Hash-based client-side routing |
| Backend | [Supabase](https://supabase.com/) (Postgres + Auth), Row-Level Security on every table |
| Auth | Email/password via Supabase Auth |
| Hosting | [Vercel](https://vercel.com/) |
| Fonts | Self-hosted (WOFF2, `font-display: swap`) — no external font CDN |
| Sound | Synthesized in-browser via the Web Audio API — no audio files or libraries |
| Exports | [SheetJS (xlsx)](https://sheetjs.com/), lazy-loaded |

---

## 🗄 Data Model

Every table is scoped to `user_id = auth.uid()` via Row-Level Security, with cascading deletes tied to `subject_id`.

- `profiles` — user identity and academic info
- `subjects` — name, code, year level, semester, instructor, archive status
- `study_sessions` — logged study time (nullable `subject_id` supports general/unassigned study)
- `grade_categories` / `grade_entries` — weighted grading structure and individual scores
- `subject_grade_configs` — per-subject grading scale overrides
- `study_plans` — interactive HTML content per subject
- `settings` — theme, Pomodoro preferences, academic defaults

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS recommended)
- A [Supabase](https://supabase.com/) project

### Setup

```bash
# Clone the repo
git clone https://github.com/<your-username>/aven.git
cd aven

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# then fill in your Supabase project URL and anon key
```

### Environment Variables

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database

Run the SQL in [`schema.sql`](./schema.sql) against your Supabase project to set up tables, RLS policies, and triggers.

### Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output is generated in `dist/`. Deployment is configured via [`vercel.json`](./vercel.json) (`framework: null`, explicit build/output settings).

---

## 📁 Project Structure

```
├── js/
│   ├── app.js              # App shell, routing, auth lifecycle
│   ├── core/                # Store, Supabase client
│   ├── domain/               # Calculation logic (grades, streaks, stats)
│   ├── pages/                # Page-level views (Subjects, Tracker, Grades, Plans, Profile, Settings)
│   ├── services/              # Data access layer
│   ├── ui/                    # Shared UI components (dropdowns, modals, toasts, skeletons)
│   └── utils/                  # Formatting and export helpers
├── css/
│   └── style.css               # Design tokens + component styles
├── schema.sql                    # Supabase schema, RLS policies, triggers
├── vercel.json                    # Deployment configuration
└── vite.config.js
```

---

## 🎨 Design

Aven uses a warm, cream-and-card visual language with pill-shaped buttons, circular icon badges, and a full animation system (`--dur-*` / `--ease-*` CSS custom properties) respecting `prefers-reduced-motion`. Multiple color themes are supported, each with light and dark variants.

---

## 🙋 Contributing

This is currently a personal/academic project. Issues and suggestions are welcome — feel free to open an issue.
