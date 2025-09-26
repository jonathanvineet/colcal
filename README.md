# Colcal Auth (Supabase + React Router)

This app includes a polished login flow using Supabase Auth:

- Google OAuth (signup + login)
- Passwordless email: magic link (signup + login)
- Protected routes with React Router
- Auth state persisted with auto token refresh

## Setup

1) Create a Supabase project at https://supabase.com

2) In your project settings, copy:
	- Project URL
	- anon public API key

3) Add a `.env.local` file in the project root with:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4) In Supabase Auth > URL Configuration:
	- Site URL: http://localhost:5173 (or your dev URL)

5) Enable Google provider in Supabase (Authentication > Providers > Google):
	- Copy the Callback URL shown in the Google provider modal in Supabase
	- Create OAuth credentials in Google Cloud Console, paste the callback URL, then copy the Client ID/Secret back into Supabase and enable Google

5) (Recommended) Create a profiles table in Supabase to track real users

SQL (run in Supabase SQL editor):

```
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text,
	updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owners"
	on public.profiles for select using ( auth.uid() = id );

create policy "Profiles are updatable by owners"
	on public.profiles for update using ( auth.uid() = id );

create policy "Profiles can be inserted by owners"
	on public.profiles for insert with check ( auth.uid() = id );
```

6) Install deps and run

```
npm install
npm run dev
```

Open the app at the printed local URL, go to /login if not redirected, and test Google/GitHub or the magic link flow.

## Files

- `src/lib/supabaseClient.js`: Supabase client setup
- `src/lib/profiles.js`: helpers to check/create a profile row for the user
- `src/auth/AuthProvider.jsx`: Provides user/session state and auth helpers
- `src/auth/context.js`: Context and `useAuth`
- `src/pages/Login.jsx`: Login UI (OAuth + magic link)
- `src/pages/AuthCallback.jsx`: Handles redirect after OAuth/magic link
- `src/pages/Home.jsx`: Example protected page
- `src/pages/Welcome.jsx`: Example dynamic landing after magic link
- `src/pages/AuthUser.jsx`: Handles /auth/:id confirmation links
- `src/lib/profiles.js`: helpers to check/create a profile row for the user

### Optional SQL for get_user_id_by_email RPC

If you want magic-link emails for existing users to include the user’s uuid in the redirect path (/auth/:uuid), create this RPC in Supabase:

```
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql stable security definer
as $$
	select id from auth.users where email = p_email limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public;
grant execute on function public.get_user_id_by_email(text) to anon, authenticated;
```

Note: This function reads from auth.users and is marked security definer. Review your security posture before enabling in production.

