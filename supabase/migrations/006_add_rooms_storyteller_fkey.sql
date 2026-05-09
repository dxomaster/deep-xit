-- Add foreign key constraint for rooms.storyteller_id
do $$ begin
  alter table rooms
    add constraint rooms_storyteller_id_fkey
    foreign key (storyteller_id)
    references players(id)
    on delete set null;
exception when duplicate_object then null;
end $$;
