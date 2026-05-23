-- PulsePoll Supabase setup
-- Paste this full file into Supabase Dashboard > SQL Editor > New query, then click Run.

create extension if not exists "pgcrypto";

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(trim(question)) between 5 and 240),
  created_at timestamptz not null default now()
);

create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  text text not null check (char_length(trim(text)) between 1 and 160),
  position int not null check (position between 1 and 6),
  created_at timestamptz not null default now(),
  unique (poll_id, position),
  unique (id, poll_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null,
  voter_session text,
  created_at timestamptz not null default now(),
  constraint votes_option_poll_fk
    foreign key (option_id, poll_id)
    references public.options(id, poll_id)
    on delete cascade
);

create index if not exists polls_created_at_idx on public.polls (created_at desc);
create index if not exists options_poll_id_position_idx on public.options (poll_id, position);
create index if not exists votes_poll_id_idx on public.votes (poll_id);
create index if not exists votes_option_id_idx on public.votes (option_id);
create index if not exists votes_created_at_idx on public.votes (created_at desc);

alter table public.polls enable row level security;
alter table public.options enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Public can read polls" on public.polls;
create policy "Public can read polls"
on public.polls for select
to anon, authenticated
using (true);

drop policy if exists "Public can create polls" on public.polls;
create policy "Public can create polls"
on public.polls for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated admins can delete polls" on public.polls;
create policy "Authenticated admins can delete polls"
on public.polls for delete
to authenticated
using (true);

drop policy if exists "Public can read options" on public.options;
create policy "Public can read options"
on public.options for select
to anon, authenticated
using (true);

drop policy if exists "Public can create options" on public.options;
create policy "Public can create options"
on public.options for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.polls
    where polls.id = options.poll_id
  )
);

drop policy if exists "Public can read votes" on public.votes;
create policy "Public can read votes"
on public.votes for select
to anon, authenticated
using (true);

drop policy if exists "Public can vote" on public.votes;
create policy "Public can vote"
on public.votes for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.options
    where options.id = votes.option_id
      and options.poll_id = votes.poll_id
  )
);

grant usage on schema public to anon, authenticated;
grant select, insert on public.polls to anon, authenticated;
grant select, insert on public.options to anon, authenticated;
grant select, insert on public.votes to anon, authenticated;
grant delete on public.polls to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'polls'
  ) then
    alter publication supabase_realtime add table public.polls;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'options'
  ) then
    alter publication supabase_realtime add table public.options;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;
