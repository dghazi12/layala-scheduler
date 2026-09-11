-- Run this once in the Supabase project's SQL editor (Dashboard > SQL Editor > New query).
-- Backs the app's window.storage shim: one row per key, e.g. "roster-v1".

create table if not exists kv_store (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table kv_store enable row level security;

-- No auth in the app yet, so the anon key needs full read/write access.
-- Anyone with the project URL and anon key (both public in the client
-- bundle) can read or overwrite the roster. Fine for an internal tool on an
-- unlisted URL; revisit if this ever needs real access control.
create policy "anon full access" on kv_store
  for all
  to anon
  using (true)
  with check (true);
