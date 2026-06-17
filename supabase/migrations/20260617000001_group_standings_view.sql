-- ============================================================================
-- View para a classificação atual dos grupos (computada a partir de matches).
-- Não usa head-to-head como tiebreaker (simplificação MVP); para isso a
-- API-Football tem standings prontos que podemos integrar depois.
-- Ordem: points DESC, goal_diff DESC, goals_for DESC, name ASC.
-- ============================================================================

create or replace view public.group_standings as
with match_rows as (
  select
    home_team_id as team_id,
    group_letter,
    home_score,
    away_score,
    case
      when home_score > away_score then 'W'
      when home_score < away_score then 'L'
      else 'D'
    end as result,
    home_score as gf,
    away_score as ga
  from public.matches
  where stage = 'group'
    and status = 'finished'
    and home_team_id is not null
    and home_score is not null
    and away_score is not null
  union all
  select
    away_team_id,
    group_letter,
    home_score,
    away_score,
    case
      when away_score > home_score then 'W'
      when away_score < home_score then 'L'
      else 'D'
    end,
    away_score,
    home_score
  from public.matches
  where stage = 'group'
    and status = 'finished'
    and away_team_id is not null
    and home_score is not null
    and away_score is not null
),
aggregated as (
  select
    t.group_letter,
    t.id as team_id,
    t.name as team_name,
    t.code as team_code,
    t.flag_url,
    count(mr.result) as played,
    count(*) filter (where mr.result = 'W')::int as won,
    count(*) filter (where mr.result = 'D')::int as drawn,
    count(*) filter (where mr.result = 'L')::int as lost,
    coalesce(sum(mr.gf), 0)::int as goals_for,
    coalesce(sum(mr.ga), 0)::int as goals_against,
    (coalesce(sum(mr.gf), 0) - coalesce(sum(mr.ga), 0))::int as goal_diff,
    (count(*) filter (where mr.result = 'W') * 3
     + count(*) filter (where mr.result = 'D'))::int as points
  from public.teams t
  left join match_rows mr on mr.team_id = t.id and mr.group_letter = t.group_letter
  group by t.group_letter, t.id, t.name, t.code, t.flag_url
)
select
  group_letter,
  team_id,
  team_name,
  team_code,
  flag_url,
  played,
  won,
  drawn,
  lost,
  goals_for,
  goals_against,
  goal_diff,
  points,
  row_number() over (
    partition by group_letter
    order by points desc, goal_diff desc, goals_for desc, team_name asc
  )::int as position
from aggregated;

grant select on public.group_standings to anon, authenticated;
