-- Create room_status enum type
do $$ begin
  create type room_status as enum ('LOBBY','STORYTELLING','BLUFFING','VOTING','SCORING','FINISHED');
exception when duplicate_object then
  -- If enum already exists, try to add FINISHED if it's not already there
  begin
    alter type room_status add value if not exists 'FINISHED';
  exception when duplicate_object then null;
end;
end $$;
