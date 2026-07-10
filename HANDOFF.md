# BLAS Canada Day Trivia — Handoff Brief (for the new Cowork session)

You are picking up a **finished** interactive team-trivia web app. It just needs to be
pushed to GitHub so Vercel deploys it. Everything below is already done except the push +
Vercel import.

---

## The app in one line
Vite + React single-page app, backed by Supabase (Postgres + Realtime). Three surfaces —
a big projector screen, a host control panel, and team devices — that stay in sync live.
It's for an in-person Canada Day team-trivia event.

## What's already set up
- **GitHub repo (empty, ready to receive the push):** https://github.com/blashq/blas-canada-trivia
- **Supabase project (already created + schema applied), region Mumbai (ap-south-1):**
  - Project ref: `uwszgigxrujudaehhrnw`
  - Project URL: `https://uwszgigxrujudaehhrnw.supabase.co`
  - Publishable (anon) key: `sb_publishable_LXqZKJ8ol1K5nOLlbW22Iw_JAy3F0fu`
  - Tables already created and live: `games`, `teams`, `answers` (permissive RLS, Realtime enabled).
    The DDL is in `supabase/schema.sql` in the source if you ever need to recreate it.
- **The Supabase URL + anon key are ALSO hard-coded as fallbacks** in `src/lib/supabase.js`,
  so the app connects out-of-the-box even with no environment variables set. (Env vars still
  override if present — see below.)

## Your job (the last mile)
1. **Clone** the repo (your session is attached to it, so push will work):
   `git clone https://<GITHUB_TOKEN>@github.com/blashq/blas-canada-trivia.git`
2. **Drop in the code** from `blas-trivia-SOURCE.zip` (unzip its contents into the repo root).
3. **Commit + push to `main`:**
   ```
   git config user.email "<the owner's email>"
   git config user.name  "BLAS"
   git add -A
   git commit -m "BLAS Canada Day Trivia app"
   git push -u origin main
   ```
4. **Vercel:** import the repo (Vercel → Add New → Project → Import `blas-canada-trivia` → Deploy).
   Vercel auto-detects Vite. No config needed. Every future push to `main` auto-deploys.
   - Optional env vars (Production) — not required because they're baked in, but cleaner:
     `VITE_SUPABASE_URL = https://uwszgigxrujudaehhrnw.supabase.co`
     `VITE_SUPABASE_ANON_KEY = sb_publishable_LXqZKJ8ol1K5nOLlbW22Iw_JAy3F0fu`
5. **Verify** the deployment reaches Ready and open the live URL.

## IMPORTANT: this is a Vite app, not Next.js
The general BLAS setup guide is written for Next.js. For this project:
- Env var names are **`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`** (not `NEXT_PUBLIC_*`).
- **No migrate-prebuild is needed** — the database schema is already applied. (If you later
  want migrations-on-deploy, the Supabase connector can run SQL directly; you don't need the
  Next.js migrate script.)
- There is no server/service_role key in the app — it only uses the public anon key in the
  browser, which is correct and safe.

## The three surfaces (routes use hash routing, so they work on any host)
- **Players join:** `https://<app>.vercel.app/`
- **Big projector screen:** `https://<app>.vercel.app/#present`
- **Host control panel (private):** `https://<app>.vercel.app/#host`

Open `/#host` first — it shows the room code + links and has **Test Mode** (End-timer,
jump-to-round, add-bots, reset) so the host can rehearse solo with a couple of browser tabs.

## Content status — READ THIS
The game **engine and all scoring are final and correct.** The **question content is DRAFT
placeholder text** so the app runs end-to-end. Two things remain for the event:
1. A fact-checked content pass on the real questions (all rounds).
2. Wiring in the host's "Spot the Canadian" **photos** (drop images in and set which are Canadian).

The complete, locked design — every round, its exact rules, scoring, timers, the finale, host
controls, Test Mode, everything — is in **canadian-trivia-spec.md** (included). Build/verify
against that.

## Quick architecture map (in the source)
- `src/lib/gameData.js` — the entire game spec as data (rounds, scoring, timers, questions). Edit content here.
- `src/lib/scoring.js` — pure scoring functions per round type.
- `src/lib/room.js` — all game actions (create/join/submit, host flow, scoring application).
- `src/lib/useGame.js` — Supabase Realtime subscription hook.
- `src/views/Join.jsx` — team/player view. `src/views/Present.jsx` — big screen. `src/views/Host.jsx` — control panel.
- `src/theme.css` — Canada Day + BLAS theming (swap `--brand-teal` for the exact BLAS hex from the logo).
