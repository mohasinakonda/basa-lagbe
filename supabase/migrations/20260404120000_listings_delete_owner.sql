-- Allow listing owners to delete their own rows (used by DELETE /api/listings/[id])
create policy "listings_delete_owner"
  on public.listings for delete
  using (auth.uid() = owner_id);
