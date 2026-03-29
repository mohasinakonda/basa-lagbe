-- Listing impressions (API inserts via service role only; RLS enabled, no policies for anon/authenticated)
create table if not exists public.listing_impressions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  referrer text,
  path text,
  viewer_id uuid references public.profiles (id) on delete set null,
  source_type text not null default 'direct'
);

create index if not exists listing_impressions_listing_id_idx on public.listing_impressions (listing_id);
create index if not exists listing_impressions_occurred_at_idx on public.listing_impressions (occurred_at desc);
create index if not exists listing_impressions_listing_occurred_idx on public.listing_impressions (listing_id, occurred_at desc);

alter table public.listing_impressions enable row level security;

-- User moderation: block creating new listings until a timestamp
alter table public.profiles
  add column if not exists listing_creation_blocked_until timestamptz,
  add column if not exists listing_creation_block_reason text;
