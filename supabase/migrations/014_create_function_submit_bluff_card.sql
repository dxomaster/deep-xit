-- Create function to submit bluff card
create or replace function submit_bluff_card(
  room_id_input uuid,
  player_id_input uuid,
  card_id_input uuid
)
returns void
language plpgsql
as $$
declare
  storyteller_id_value uuid;
  non_storyteller_count integer;
  submitted_bluff_count integer;
begin
  select storyteller_id
  into storyteller_id_value
  from rooms
  where id = room_id_input
    and status = 'BLUFFING';

  if storyteller_id_value is null then
    raise exception 'Room is not ready for bluff submission';
  end if;

  if player_id_input = storyteller_id_value then
    raise exception 'Storyteller cannot submit a bluff card';
  end if;

  if not exists (
    select 1
    from players
    where id = player_id_input
      and room_id = room_id_input
  ) then
    raise exception 'Player does not belong to this room';
  end if;

  if not exists (
    select 1
    from cards
    where id = card_id_input
      and room_id = room_id_input
      and player_id = player_id_input
      and is_storyteller_card = false
  ) then
    raise exception 'Selected card does not belong to the bluffing player in this room';
  end if;

  if exists (
    select 1
    from cards
    where room_id = room_id_input
      and player_id = player_id_input
      and is_submitted_for_round = true
  ) then
    raise exception 'Player has already submitted a bluff card';
  end if;

  update cards
  set is_submitted_for_round = true
  where id = card_id_input;

  select count(*)
  into non_storyteller_count
  from players
  where room_id = room_id_input
    and id <> storyteller_id_value;

  select count(distinct player_id)
  into submitted_bluff_count
  from cards
  where room_id = room_id_input
    and is_submitted_for_round = true
    and is_storyteller_card = false;

  if submitted_bluff_count >= non_storyteller_count then
    update rooms
    set status = 'VOTING'
    where id = room_id_input;
  end if;
end;
$$;
