# Colcal (Clerk Auth + Supabase Profiles + FullCalendar)

Colcal now uses Clerk for authentication and a monochrome, futuristic UI. User profile data is persisted to Supabase, and the calendar UI is styled to feel robotic and minimal.

## Setup

1) Create a Clerk application at https://clerk.com and copy the Publishable Key.

2) Create a Supabase project at https://supabase.com and copy:
   - Project URL
   - anon public API key

3) Add a `.env.local` file in the project root with:

```
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4) In Supabase, create a `profiles` table to store user records (Clerk `user.id` is stored as `profiles.id`).

SQL (run in Supabase SQL editor):

```
create table if not exists public.profiles (
  id text primary key,
  email text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owners"
  on public.profiles for select using ( auth.jwt() is not null );

create policy "Profiles are updatable by owners"
  on public.profiles for update using ( auth.jwt() is not null );

create policy "Profiles can be inserted by owners"
  on public.profiles for insert with check ( auth.jwt() is not null );
```

Note: If you previously used `uuid` referencing `auth.users(id)`, you can migrate to a `text` primary key to store Clerk ids (e.g. `user_...`).

5) Install deps and run

```
npm install
npm run dev
```

Open the app at the printed local URL. The `/login` route renders Clerk’s SignIn. After sign-in, the app upserts the user into Supabase `profiles`.

## Files

- `src/auth/AuthProvider.jsx`: Wraps app with `ClerkProvider`, exposes `useAuth` with `user`, `loading`, `signOut`
- `src/lib/supabaseClient.js`: Supabase client setup
- `src/lib/profiles.js`: Upserts Clerk user into `profiles`
- `src/pages/Login.jsx`: Clerk SignIn UI
- `src/pages/Home.jsx`: Protected page with styled FullCalendar
- `src/components/Calendar.jsx`: FullCalendar with local persistence
- `src/index.css`: Futuristic monochrome global theme


