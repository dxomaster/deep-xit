create extension if not exists "pgcrypto";

create type room_status as enum (
  'LOBBY',
  'STORYTELLING',
  'BLUFFING',
  'VOTING',
  'SCORING'
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  status room_status not null default 'LOBBY',
  storyteller_id uuid null,
  clue text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  display_name text not null,
  score integer not null default 0 check (score >= 0),
  session_id text not null,
  created_at timestamptz not null default now(),
  constraint players_room_session_unique unique (room_id, session_id)
);

alter table rooms
  add constraint rooms_storyteller_id_fkey
  foreign key (storyteller_id)
  references players(id)
  on delete set null;

create table cards (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  image_url text not null,
  is_storyteller_card boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index cards_one_storyteller_card_per_room
  on cards(room_id)
  where is_storyteller_card = true;

create table votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  voter_id uuid not null references players(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_one_vote_per_player_per_room unique (room_id, voter_id)
);

create index players_room_id_idx on players(room_id);
create index cards_room_id_idx on cards(room_id);
create index cards_player_id_idx on cards(player_id);
create index votes_room_id_idx on votes(room_id);
create index votes_card_id_idx on votes(card_id);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rooms_set_updated_at
before update on rooms
for each row
execute function set_updated_at();

create or replace function increment_player_score(player_id_input uuid, points_input integer)
returns void
language sql
as $$
  update players
  set score = score + points_input
  where id = player_id_input;
$$;

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table votes;
