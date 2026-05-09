-- Add is_submitted_for_round column to cards
alter table cards add column if not exists is_submitted_for_round boolean not null default false;
