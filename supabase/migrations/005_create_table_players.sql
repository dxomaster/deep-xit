-- Create players table
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  display_name text not null,
  score integer not null default 0 check (score >= 0),
  session_id text not null,
  created_at timestamptz not null default now(),
  constraint players_room_session_unique unique (room_id, session_id)
);
