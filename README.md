# Colcal (Collaborative Calendar)

## Overview

**Colcal** is a modern, futuristic collaborative calendar application built with Next.js 15, designed to streamline team coordination and personal scheduling. The application features a sleek, monochrome UI with a robotic aesthetic that combines powerful functionality with minimalist design principles.

## Purpose

Colcal addresses the challenge of managing both personal and team schedules in a unified, intuitive interface. It serves as a central hub where teams can:

- **Coordinate Schedules**: View and manage team members' availability in real-time
- **Track Work**: Monitor daily tasks and assignments across your organization
- **Collaborate Efficiently**: Share calendar events and notes with team members
- **Maintain Privacy**: Secure authentication ensures only authorized users access sensitive scheduling data
- **Stay Organized**: Keep personal notes and track your daily work alongside team activities

The application is perfect for small to medium-sized teams, remote workers, project managers, and anyone who needs a modern calendar solution that goes beyond basic scheduling.

## Key Features

### 🔐 **Secure Authentication**

- Powered by **Clerk** for enterprise-grade user authentication
- Seamless sign-in/sign-up experience with multiple authentication methods
- Protected routes ensure data privacy and security

### 📅 **Interactive Calendar**

- Built on **FullCalendar** for robust event management
- Multiple calendar views (day, week, month, list)
- Drag-and-drop event creation and editing
- Local event persistence

### 👥 **Team Collaboration**

- View your team's schedules and availability
- See who's working on what in real-time
- Coordinate meetings and project timelines

### 📝 **Personal Workspace**

- Self-notes section for private reminders and thoughts
- Today's work tracker to monitor daily tasks
- Current date card with quick access to today's schedule

### 🎨 **Futuristic Design**

- Monochrome, cyberpunk-inspired interface
- Orbitron and Rajdhani fonts for a tech-forward aesthetic
- Responsive design that works on all devices
- Smooth animations and transitions

### 🗄️ **Data Persistence**

- **Supabase** backend for reliable data storage
- User profiles automatically synced with authentication
- Real-time data updates across sessions

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Authentication**: Clerk
- **Database**: Supabase
- **Calendar**: FullCalendar
- **Styling**: Custom CSS with futuristic theme
- **Language**: JavaScript (ES6+)

## Setup

1. Create a Clerk application at https://clerk.com and copy the Publishable Key.

2. Create a Supabase project at https://supabase.com and copy:
   - Project URL
   - anon public API key

3. Add a `.env` or `.env.local` file in the project root with:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. In Supabase, create a `profiles` table to store user records (Clerk `user.id` is stored as `profiles.id`).

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

5. Install deps and run

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

## Usage

### First-Time Users

1. Navigate to the application URL in your browser
2. You'll be redirected to the `/login` route
3. Sign in using Clerk's authentication (email, social login, etc.)
4. Upon successful authentication, you'll be automatically redirected to the home page
5. Your user profile will be created in Supabase automatically

### Using the Calendar

- **Add Events**: Click on any date/time slot to create a new event
- **Edit Events**: Click on existing events to modify details
- **Drag & Drop**: Move events by dragging them to new time slots
- **View Modes**: Switch between day, week, month, and list views
- **Team View**: Check the "Your Teams" card to see team member availability
- **Daily Tasks**: Use "Today's Work" card to track current assignments

### Dashboard Cards

- **Current Date Card**: Quick reference for today's date and navigation
- **Today's Work Card**: Overview of tasks and events scheduled for today
- **Your Teams Card**: List of team members and their current status
- **Self Notes Card**: Personal note-taking area for reminders and thoughts

## Development

### Project Structure

```
colcal/
├── app/                      # Next.js App Router
│   ├── layout.js            # Root layout with ClerkProvider
│   ├── page.js              # Home page (protected)
│   └── login/[[...rest]]/   # Clerk SignIn catch-all route
├── src/
│   ├── auth/                # Authentication logic
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utilities and API clients
│   └── pages/               # Page components
└── public/                  # Static assets
```

### Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### "Clerk component not configured correctly" Error

If you see this error, ensure:

1. The login route is using the catch-all pattern: `/login/[[...rest]]/page.js`
2. Your `.env` file contains `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. You've added your Clerk Secret Key to `.env`

### Supabase Connection Issues

- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Ensure the `profiles` table exists in your Supabase project
- Check that RLS policies are properly configured

### Events Not Persisting

- Check browser console for errors
- Verify Supabase connection is active
- Ensure user is properly authenticated with Clerk

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available for personal and commercial use.

---

**Built with ❤️ using Next.js, Clerk, and Supabase**
