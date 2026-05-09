-- Create function to increment player score
create or replace function increment_player_score(player_id_input uuid, points_input integer)
returns void
language sql
as $$
  update players
  set score = score + points_input
  where id = player_id_input;
$$;
