create table if not exists public.bookings (
  id uuid primary key,
  guest_name text not null,
  room integer not null check (room between 1 and 4),
  deposit numeric not null check (deposit >= 0),
  check_in date not null,
  check_out date not null,
  created_at timestamptz not null default now(),
  constraint valid_stay_dates check (check_out > check_in)
);

alter table public.bookings enable row level security;

create policy "public can read bookings"
  on public.bookings for select using (true);
create policy "public can create bookings"
  on public.bookings for insert with check (true);
create policy "public can edit bookings"
  on public.bookings for update using (true) with check (true);
create policy "public can cancel bookings"
  on public.bookings for delete using (true);
