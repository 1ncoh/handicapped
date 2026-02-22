create extension if not exists pgcrypto;

create table if not exists players (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tee text not null,
  holes int not null check (holes in (9, 18)),
  course_rating numeric(4,1) not null,
  slope_rating int not null,
  par int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references players(id) on delete cascade,
  played_at date not null,
  course_id uuid not null references courses(id) on delete restrict,
  holes int not null check (holes in (9, 18)),
  score int not null,
  putts int null,
  balls_lost int null,
  gir int null,
  fir int null,
  three_putts int null,
  pcc int not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rounds_player_played_idx on rounds(player_id, played_at desc);
create index if not exists rounds_course_idx on rounds(course_id);
create index if not exists courses_name_idx on courses(name);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists courses_set_updated_at on courses;
create trigger courses_set_updated_at
before update on courses
for each row
execute function set_updated_at();

drop trigger if exists rounds_set_updated_at on rounds;
create trigger rounds_set_updated_at
before update on rounds
for each row
execute function set_updated_at();

alter table players enable row level security;
alter table courses enable row level security;
alter table rounds enable row level security;

-- Intentionally no anon/authenticated policies. App uses service role from server only.

insert into players (id, name)
values
  ('randall', 'Randall'),
  ('jaden', 'Jaden')
on conflict (id) do update set name = excluded.name;
