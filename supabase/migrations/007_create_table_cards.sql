-- Create cards table
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  image_url text not null,
  is_storyteller_card boolean not null default false,
  created_at timestamptz not null default now()
);
