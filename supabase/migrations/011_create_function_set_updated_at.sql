-- Create function to auto-update updated_at timestamp
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger for rooms table
drop trigger if exists rooms_set_updated_at on rooms;
create trigger rooms_set_updated_at
before update on rooms
for each row
execute function set_updated_at();
