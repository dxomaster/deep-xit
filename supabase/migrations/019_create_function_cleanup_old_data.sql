-- Create function to cleanup old data
create or replace function cleanup_old_data()
returns void
language plpgsql
as $$
begin
  -- Delete rooms older than 1 hour (cascade will delete related players, cards, votes)
  delete from rooms
  where created_at < now() - interval '1 hour';
  
  -- Log cleanup
  raise notice 'Cleanup completed at %', now();
end;
$$;
