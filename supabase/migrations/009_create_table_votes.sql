-- Create votes table
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  voter_id uuid not null references players(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_one_vote_per_player_per_room unique (room_id, voter_id)
);
