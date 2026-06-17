-- ============================================================================
-- 001_init: schema base + RLS + scoring config
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type match_stage as enum (
  'group',
  'round_of_32',
  'round_of_16',
  'quarter_final',
  'semi_final',
  'third_place',
  'final'
);

create type match_status as enum (
  'scheduled',
  'live',
  'finished',
  'cancelled'
);

create type score_source as enum ('match', 'group', 'tournament');

-- ----------------------------------------------------------------------------
-- teams: 48 seleções da Copa, agrupadas em A..L
-- ----------------------------------------------------------------------------
create table public.teams (
  id            int primary key,                  -- API-Football team id
  name          text not null,
  code          text not null,                    -- 3 letras (BRA, ARG, ...)
  flag_url      text,
  group_letter  char(1) not null check (group_letter between 'A' and 'L'),
  fifa_ranking  int,
  created_at    timestamptz not null default now()
);

create index teams_group_letter_idx on public.teams (group_letter);

-- ----------------------------------------------------------------------------
-- matches: 104 partidas (72 grupos + 32 mata-mata)
-- ----------------------------------------------------------------------------
create table public.matches (
  id                    int primary key,         -- API-Football fixture id
  home_team_id          int references public.teams(id),
  away_team_id          int references public.teams(id),
  kickoff_at            timestamptz not null,
  stage                 match_stage not null,
  group_letter          char(1) check (group_letter is null or group_letter between 'A' and 'L'),
  status                match_status not null default 'scheduled',
  home_score            int,
  away_score            int,
  home_score_extra      int,
  away_score_extra      int,
  home_score_penalties  int,
  away_score_penalties  int,
  venue                 text,
  last_synced_at        timestamptz,
  created_at            timestamptz not null default now(),
  constraint matches_group_only_for_group_stage check (
    (stage = 'group' and group_letter is not null) or
    (stage <> 'group' and group_letter is null)
  )
);

create index matches_kickoff_idx on public.matches (kickoff_at);
create index matches_status_idx on public.matches (status);
create index matches_stage_idx on public.matches (stage);

-- ----------------------------------------------------------------------------
-- profiles: 1:1 com auth.users
-- ----------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text not null check (char_length(display_name) between 2 and 40),
  avatar_seed       text not null,
  avatar_style      text not null default 'fun-emoji',
  favorite_team_id  int references public.teams(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- predictions: palpite por partida (placar)
-- ----------------------------------------------------------------------------
create table public.predictions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  match_id    int  not null references public.matches(id),
  home_score  int  not null check (home_score between 0 and 20),
  away_score  int  not null check (away_score between 0 and 20),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, match_id)
);

create index predictions_match_idx on public.predictions (match_id);
create index predictions_user_idx  on public.predictions (user_id);

-- ----------------------------------------------------------------------------
-- group_predictions: palpite de classificação por grupo (1º..4º)
-- ----------------------------------------------------------------------------
create table public.group_predictions (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  group_letter    char(1) not null check (group_letter between 'A' and 'L'),
  first_team_id   int not null references public.teams(id),
  second_team_id  int not null references public.teams(id),
  third_team_id   int not null references public.teams(id),
  fourth_team_id  int not null references public.teams(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, group_letter),
  constraint group_predictions_unique_teams check (
    first_team_id <> second_team_id and
    first_team_id <> third_team_id  and
    first_team_id <> fourth_team_id and
    second_team_id <> third_team_id and
    second_team_id <> fourth_team_id and
    third_team_id <> fourth_team_id
  )
);

-- ----------------------------------------------------------------------------
-- tournament_predictions: campeão / vice / terceiro lugar
-- ----------------------------------------------------------------------------
create table public.tournament_predictions (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  champion_team_id     int not null references public.teams(id),
  runner_up_team_id    int not null references public.teams(id),
  third_place_team_id  int not null references public.teams(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint tournament_predictions_distinct check (
    champion_team_id <> runner_up_team_id and
    champion_team_id <> third_place_team_id and
    runner_up_team_id <> third_place_team_id
  )
);

-- ----------------------------------------------------------------------------
-- scores: pontuação calculada por edge function
-- ----------------------------------------------------------------------------
create table public.scores (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  source        score_source not null,
  match_id      int  references public.matches(id),
  group_letter  char(1) check (group_letter is null or group_letter between 'A' and 'L'),
  points        int not null,
  breakdown     jsonb not null default '{}'::jsonb,
  computed_at   timestamptz not null default now(),
  unique (user_id, source, match_id, group_letter)
);

create index scores_user_idx on public.scores (user_id);

-- ----------------------------------------------------------------------------
-- scoring_config: parâmetros editáveis
-- ----------------------------------------------------------------------------
create table public.scoring_config (
  key    text primary key,
  value  jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.scoring_config (key, value) values
  ('match', jsonb_build_object(
    'exact_score', 10,
    'correct_result', 5,
    'correct_goal_diff_bonus', 2
  )),
  ('group', jsonb_build_object(
    'first',  5,
    'second', 5,
    'third',  3,
    'fourth', 2,
    'qualifier_bonus_per_team', 3
  )),
  ('tournament', jsonb_build_object(
    'champion',   30,
    'runner_up',  15,
    'third_place', 10
  )),
  ('lock_minutes', to_jsonb(5))
  ;

-- ----------------------------------------------------------------------------
-- View para soma de pontos por usuário (usado pelo ranking)
-- ----------------------------------------------------------------------------
create view public.user_total_scores as
select
  p.id            as user_id,
  p.display_name,
  p.avatar_seed,
  p.avatar_style,
  coalesce(sum(s.points), 0)::int as total_points
from public.profiles p
left join public.scores s on s.user_id = p.id
group by p.id, p.display_name, p.avatar_seed, p.avatar_style;

-- ----------------------------------------------------------------------------
-- Helper: respeita lock de palpites (configurável em scoring_config)
-- ----------------------------------------------------------------------------
create or replace function public.match_predictions_open(p_match_id int)
returns boolean
language sql
stable
as $$
  select
    m.status = 'scheduled' and
    m.kickoff_at - (((select value::int from public.scoring_config where key = 'lock_minutes')) * interval '1 minute') > now()
  from public.matches m
  where m.id = p_match_id
$$;

-- ----------------------------------------------------------------------------
-- Auto-update updated_at
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger predictions_touch_updated_at before update on public.predictions
  for each row execute function public.touch_updated_at();
create trigger group_predictions_touch_updated_at before update on public.group_predictions
  for each row execute function public.touch_updated_at();
create trigger tournament_predictions_touch_updated_at before update on public.tournament_predictions
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.teams                  enable row level security;
alter table public.matches                enable row level security;
alter table public.profiles               enable row level security;
alter table public.predictions            enable row level security;
alter table public.group_predictions      enable row level security;
alter table public.tournament_predictions enable row level security;
alter table public.scores                 enable row level security;
alter table public.scoring_config         enable row level security;

-- teams / matches / scoring_config: leitura pública, escrita só via service role
create policy "teams read" on public.teams
  for select to authenticated, anon using (true);

create policy "matches read" on public.matches
  for select to authenticated, anon using (true);

create policy "scoring_config read" on public.scoring_config
  for select to authenticated, anon using (true);

create policy "scores read" on public.scores
  for select to authenticated, anon using (true);

-- profiles: select público, escrita só do dono
create policy "profiles read" on public.profiles
  for select to authenticated, anon using (true);

create policy "profiles insert own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles update own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- predictions: select próprio sempre; público após kickoff. Escrita só pré-lock.
create policy "predictions read own" on public.predictions
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.matches m where m.id = match_id and m.kickoff_at <= now())
  );

create policy "predictions insert own pre-lock" on public.predictions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.match_predictions_open(match_id)
  );

create policy "predictions update own pre-lock" on public.predictions
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.match_predictions_open(match_id)
  );

-- group_predictions: select próprio sempre; público após início da última partida do grupo.
create policy "group_predictions read own" on public.group_predictions
  for select to authenticated
  using (user_id = auth.uid());

create policy "group_predictions insert own pre-stage-end" on public.group_predictions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.stage = 'group' and m.group_letter = group_predictions.group_letter
        and m.status = 'scheduled'
    )
  );

create policy "group_predictions update own pre-stage-end" on public.group_predictions
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.stage = 'group' and m.group_letter = group_predictions.group_letter
        and m.status = 'scheduled'
    )
  );

-- tournament_predictions: select próprio. Lock no fim da fase de grupos (27/06/2026).
create policy "tournament_predictions read own" on public.tournament_predictions
  for select to authenticated
  using (user_id = auth.uid());

create policy "tournament_predictions write own pre-lock" on public.tournament_predictions
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.stage = 'group' and m.status = 'scheduled'
    )
  );
