# Buttu Tracker 🍼

A mobile-first, glassmorphism-styled baby tracking web app for Buttu (b. Jan 10, 2026), built for a Tamil family in the USA. Tracks sleep, feeding, solids, diapers, and growth, and gives supportive, rule-based guidance based on Buttu's age and recent patterns.

**This app does not diagnose medical conditions.** It offers supportive suggestions only and always tells parents to contact their pediatrician for red-flag symptoms.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (glassmorphism theme, custom animations)
- Framer Motion for animations/transitions
- Supabase (Postgres + Auth) for data and login
- Recharts for trend charts
- jsPDF / jspdf-autotable + SheetJS (xlsx) for PDF/Excel export

## Getting started

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates all tables, indexes, and row-level security policies (each parent can only see their own baby's data).
3. Under **Project Settings → API**, copy the **Project URL** and **anon public key**.

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase values:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with an email/password — a Buttu profile (DOB Jan 10, 2026, Tamil family, no beef/pork) is auto-created on first login.

## Features

- **Sleep** — log naps/night sleep, see wake windows, overtired/short-nap flags, and nap/bedtime suggestions based on Buttu's age.
- **Feeding** — breastfeeding (side/duration), bottle (ml), pumping, with feeding-gap reminders.
- **Solids** — 3-day food-watch tracking, reaction logging, and next-food suggestions that prioritize iron-rich and Tamil/Indian first foods (ragi, moong dal, keerai, etc.), respecting the no beef/no pork restriction.
- **Diapers** — wet/poop tracking with color/texture notes and constipation-pattern guidance.
- **Growth** — weight/length/head circumference over time with pediatrician visit notes.
- **Dashboard** — daily KPIs (total sleep, naps, longest wake window, feeds, solids, diapers, symptoms), 7-day trend charts, and a daily "AI-style" headline suggestion.
- **Guidance engine** (`src/lib/guidance/engine.ts`) — rule-based, age-aware suggestions plus red-flag detection (severe reactions, breathing issues, repeated vomiting, blood in stool, fever, dehydration, poor feeding) that always defers to the pediatrician.
- **Export** — one-tap PDF and Excel export of the rolling summary for pediatrician visits.

## Project structure

```
src/
  app/
    login/, signup/          — auth pages
    (app)/                   — authenticated app shell (dashboard, sleep, feeding, solids, diapers, growth)
  components/
    ui/                      — glass UI primitives (GlassCard, Button, StatCard, GuidanceList, LogRow)
    charts/                  — recharts wrappers
    nav/                     — bottom nav + app shell
    quick-add/               — quick-add bottom sheet (nap/feed/diaper/solid)
  lib/
    guidance/engine.ts        — rule-based guidance engine
    foods.ts                 — Tamil/Indian-aware food bank + next-food suggestions
    age.ts                    — age math + wake window/nap/sleep targets
    export.ts                 — PDF/Excel export
    supabase/                 — Supabase client/server/proxy helpers
supabase/schema.sql            — full DB schema + RLS policies
```

Note: this Next.js version renames `middleware.ts` to `proxy.ts` (see `src/proxy.ts`) — this is expected, not a mistake.

## Roadmap to native apps

This is a mobile-first responsive web app (with a `manifest.json` already in place) so it can later be wrapped as an installable PWA or ported into a React Native / Capacitor shell for the App Store and Play Store.
