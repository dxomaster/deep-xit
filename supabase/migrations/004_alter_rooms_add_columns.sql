-- Add theme column to rooms
alter table rooms
add column if not exists theme text null;

-- Add max_rounds column to rooms
alter table rooms
add column if not exists max_rounds integer not null default 10 check (max_rounds > 0);

-- Add current_round column to rooms
alter table rooms
add column if not exists current_round integer not null default 1 check (current_round > 0);
