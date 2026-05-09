-- Create indexes for cards
create unique index if not exists cards_one_storyteller_card_per_room
  on cards(room_id)
  where is_storyteller_card = true;

create index if not exists cards_room_submitted_idx
  on cards(room_id, is_submitted_for_round);

-- Create indexes for players, cards, and votes
create index if not exists players_room_id_idx on players(room_id);
create index if not exists cards_room_id_idx on cards(room_id);
create index if not exists cards_player_id_idx on cards(player_id);
create index if not exists votes_room_id_idx on votes(room_id);
create index if not exists votes_card_id_idx on votes(card_id);
