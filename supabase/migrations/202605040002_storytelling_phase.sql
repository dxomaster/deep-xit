alter table cards
  add column if not exists is_submitted_for_round boolean not null default false;

create or replace function submit_storyteller_clue(
  room_id_input uuid,
  storyteller_id_input uuid,
  card_id_input uuid,
  clue_input text
)
returns void
language plpgsql
as $$
begin
  if length(trim(clue_input)) = 0 then
    raise exception 'Clue cannot be empty';
  end if;

  if not exists (
    select 1
    from rooms
    where id = room_id_input
      and storyteller_id = storyteller_id_input
      and status = 'STORYTELLING'
  ) then
    raise exception 'Room is not ready for storyteller submission';
  end if;

  if not exists (
    select 1
    from cards
    where id = card_id_input
      and room_id = room_id_input
      and player_id = storyteller_id_input
  ) then
    raise exception 'Selected card does not belong to the storyteller in this room';
  end if;

  update cards
  set is_storyteller_card = false
  where room_id = room_id_input;

  update cards
  set is_storyteller_card = true,
      is_submitted_for_round = true
  where id = card_id_input;

  update rooms
  set clue = trim(clue_input),
      status = 'BLUFFING'
  where id = room_id_input;
end;
$$;
