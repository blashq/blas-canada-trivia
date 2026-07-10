-- BLAS Canada Day Trivia — database schema
-- Ephemeral event app: no user auth, permissive RLS, realtime on all tables.

-- ============ TABLES ============

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  phase text not null default 'lobby',        -- lobby | intro | question | reveal | round_recap | final_wager | final_reveal | done
  current_round int not null default 0,        -- index into rounds config
  current_question int not null default 0,     -- index into that round's questions
  clue_index int not null default 0,           -- for clue-drip rounds
  revealed boolean not null default false,      -- host has triggered the reveal
  accepting boolean not null default false,     -- entries currently open
  question_started_at timestamptz,             -- when the current question timer started (for drip timing)
  test_mode boolean not null default false,
  data jsonb not null default '{}'::jsonb,      -- misc scratch (e.g., wager category shown)
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  name text not null,
  color text not null default '#D80621',
  avatar text not null default 'leaf',
  score numeric not null default 0,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  round_index int not null,
  question_index int not null,
  value jsonb not null,               -- selected option id(s), true/false, or wager fraction+choice
  clue_index int not null default 0,  -- clue tier at lock-in (for drip scoring)
  points numeric,                     -- filled at reveal/scoring time
  created_at timestamptz not null default now(),
  unique (team_id, round_index, question_index)
);

-- ============ REALTIME ============
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table answers;

-- ============ RLS (permissive — event app, no accounts) ============
alter table games enable row level security;
alter table teams enable row level security;
alter table answers enable row level security;

create policy "anon all games"   on games   for all using (true) with check (true);
create policy "anon all teams"   on teams   for all using (true) with check (true);
create policy "anon all answers" on answers for all using (true) with check (true);
