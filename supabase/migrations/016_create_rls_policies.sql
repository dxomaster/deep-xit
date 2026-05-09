-- Create RLS policies for rooms
drop policy if exists "Allow all access to rooms" on rooms;
drop policy if exists "Allow read access to rooms" on rooms;
create policy "Allow read access to rooms" on rooms for select using (true);

-- Create RLS policies for players
drop policy if exists "Allow all access to players" on players;
drop policy if exists "Allow read access to players" on players;
create policy "Allow read access to players" on players for select using (true);

-- Create RLS policies for cards
drop policy if exists "Allow all access to cards" on cards;
drop policy if exists "Allow read access to cards" on cards;
create policy "Allow read access to cards" on cards for select using (true);

-- Create RLS policies for votes
drop policy if exists "Allow all access to votes" on votes;
drop policy if exists "Allow read access to votes" on votes;
create policy "Allow read access to votes" on votes for select using (true);
