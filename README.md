# PulsePoll

A production-ready live polling app built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Project Structure

```text
.
├── supabase/schema.sql          # Full database schema, RLS, grants, realtime setup
├── src/components               # Reusable layout, modal, loading, chart components
├── src/lib                      # Supabase client and poll data helpers
├── src/pages                    # Create, vote, login, dashboard, analytics pages
├── src/types                    # Shared TypeScript data types
├── .env.example                 # Environment variable template
└── package.json
```

## Supabase SQL Setup

1. Open your Supabase project: `https://supabase.com/dashboard/project/ywnukomcotkonopjmwyp`.
2. Go to `SQL Editor`.
3. Click `New query`.
4. Paste the full contents of `supabase/schema.sql`.
5. Click `Run`.

The SQL creates `polls`, `options`, and `votes`; adds UUID primary keys, timestamps, foreign keys, cascading deletes, indexes, RLS policies, grants, and realtime publication entries.

## Admin Auth Setup

1. In Supabase, go to `Authentication` > `Users`.
2. Click `Add user`.
3. Create an email/password user.
4. Use those credentials at `/login`.

The included policy allows any authenticated Supabase user to delete polls. For a multi-admin production system, add an admin profile/role table and tighten the delete policy to that role.

## Environment Setup

`.env` is already populated for this project:

```bash
VITE_SUPABASE_URL=https://ywnukomcotkonopjmwyp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_haiz9mzRmrq8s5j3Pr-z0w_bSWU7Tyh
```

## Install And Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in your terminal, usually `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Realtime Implementation

The app subscribes to Supabase Postgres Changes on `public.votes` with a per-poll filter:

```ts
supabase
  .channel(`poll-results-${pollId}`)
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'votes', filter: `poll_id=eq.${pollId}` },
    (payload) => {
      // Append the new vote and recalculate chart percentages.
    },
  )
  .subscribe();
```

The schema adds `polls`, `options`, and `votes` to `supabase_realtime`. RLS `SELECT` policies are present so clients can receive authorized realtime changes.

## Deployment

1. Run `npm run build`.
2. Deploy the `dist` folder to Vercel, Netlify, Cloudflare Pages, or another static host.
3. Add these environment variables in the host dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Configure SPA fallback/rewrites so routes like `/poll/:id` and `/admin/polls/:id` serve `index.html`.

For Vercel, the default Vite preset handles the build command and output directory. For Netlify, use build command `npm run build` and publish directory `dist`.
