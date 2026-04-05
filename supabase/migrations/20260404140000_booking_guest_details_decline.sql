-- Guest contact snapshot + decline note; profile address for hosts to see
alter table public.profiles
  add column if not exists contact_address text;

alter table public.bookings
  add column if not exists guest_email text,
  add column if not exists owner_decline_message text;

-- Listing owners may read guest profiles when that guest has a booking on the owner's listing
create policy "profiles_select_guest_for_owner_booking"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.bookings b
      inner join public.listings l on l.id = b.listing_id
      where b.guest_id = profiles.id
        and l.owner_id = auth.uid()
    )
  );
