-- PulsePoll reset setup
-- Use this when an older/incompatible table already exists in the Supabase project.
-- WARNING: This deletes existing polls, options, and votes before recreating them.
-- Paste these three statements into Supabase Dashboard > SQL Editor > New query, then click Run.
-- After they finish, paste and run the full contents of supabase/schema.sql.

drop table if exists public.votes cascade;
drop table if exists public.options cascade;
drop table if exists public.polls cascade;
