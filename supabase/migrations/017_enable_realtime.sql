-- Enable Supabase Realtime for all tables
do $$ begin
  alter publication supabase_realtime add table rooms;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table players;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table cards;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table votes;
exception when duplicate_object then null;
end $$;
