-- Create rooms table
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  status room_status not null default 'LOBBY',
  storyteller_id uuid null,
  clue text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
