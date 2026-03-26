-- Run in Supabase SQL Editor (or supabase db push). Enable PostGIS in Dashboard if you add geography later; lat/lng columns work without it.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  phone_e164 text unique,
  phone_verified_at timestamptz,
  role text not null default 'user' check (role in ('user', 'landlord', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_phone_e164_idx on public.profiles (phone_e164) where phone_e164 is not null;

-- Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('family', 'bachelor', 'both')),
  lat double precision not null,
  lng double precision not null,
  price numeric not null,
  currency text not null default 'BDT',
  bedrooms int not null default 0,
  bathrooms int not null default 0,
  area_sq_ft int not null default 0,
  address text not null default '',
  photos jsonb not null default '[]'::jsonb,
  amenities jsonb not null default '[]'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_owner_id_idx on public.listings (owner_id);
create index if not exists listings_status_expires_idx on public.listings (status, expires_at);
create index if not exists listings_lat_lng_idx on public.listings (lat, lng);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  guest_display_name text not null,
  listing_title text not null,
  status text not null default 'pending_owner' check (
    status in ('pending_owner', 'confirmed', 'declined', 'cancelled_by_guest')
  ),
  requested_start date not null,
  requested_end date not null,
  message text,
  owner_responded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bookings_dates_chk check (requested_end >= requested_start)
);

create index if not exists bookings_listing_id_idx on public.bookings (listing_id);
create index if not exists bookings_guest_id_idx on public.bookings (guest_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, ''), '@', 1),
      'User'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Listings: public map reads published & not expired
create policy "listings_select_public"
  on public.listings for select
  using (status = 'published' and expires_at > now());

create policy "listings_select_owner"
  on public.listings for select
  using (auth.uid() = owner_id);

create policy "listings_insert_owner"
  on public.listings for insert
  with check (auth.uid() = owner_id);

create policy "listings_update_owner"
  on public.listings for update
  using (auth.uid() = owner_id);

-- Bookings
create policy "bookings_select_guest"
  on public.bookings for select
  using (auth.uid() = guest_id);

create policy "bookings_select_owner"
  on public.bookings for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  );

create policy "bookings_insert_guest"
  on public.bookings for insert
  with check (
    auth.uid() = guest_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.owner_id <> auth.uid()
        and l.status = 'published'
        and l.expires_at > now()
    )
  );

create policy "bookings_guest_cancel"
  on public.bookings for update
  using (auth.uid() = guest_id and status = 'pending_owner')
  with check (auth.uid() = guest_id and status = 'cancelled_by_guest');

create policy "bookings_owner_respond"
  on public.bookings for update
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
    and status = 'pending_owner'
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
    and status in ('confirmed', 'declined')
  );
