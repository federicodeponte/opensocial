# OpenSocial - Complete Setup Guide

This guide will walk you through setting up OpenSocial from scratch.

## Prerequisites

- Node.js 18+ and npm installed
- Git installed
- GitHub account
- Supabase account (free tier is fine)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/federicodeponte/opensocial.git
cd opensocial

# Install dependencies
npm install
```

## Step 2: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: opensocial (or your preferred name)
   - **Database Password**: (save this somewhere secure)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be created

## Step 3: Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click on **API** in the Configuration section
3. You'll need these three values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: Your public anonymous key (starts with `eyJ...`)
   - **service_role**: Your service role key (starts with `eyJ...` - click "Reveal" to see it)

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 5: Run Database Migrations

### Option A: Using Supabase Dashboard (Easier)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20251117100618_initial_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR-PROJECT-ID

# Push the database schema
supabase db push
```

## Step 6: Verify Database Setup

1. In your Supabase dashboard, go to **Table Editor**
2. You should see three tables:
   - `profiles`
   - `posts`
   - `follows`
3. Click on each table to verify the columns exist

## Step 7: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Application

1. You should be redirected to `/signup`
2. Create a new account:
   - **Username**: yourname (3-15 characters, letters/numbers/underscores)
   - **Display Name**: Your Name (optional)
   - **Email**: your@email.com
   - **Password**: (at least 6 characters)
3. Click **Sign up**
4. You should be redirected to `/home`
5. Try creating a post!

## Troubleshooting

### "Failed to create post"

**Cause**: Database migration didn't run correctly.

**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration SQL manually (Step 5, Option A)
3. Check **Table Editor** to verify tables exist

### "Unauthorized" when trying to post

**Cause**: Supabase environment variables are incorrect.

**Solution**:
1. Double-check `.env.local` has correct values
2. Restart your dev server: `npm run dev`
3. Clear your browser cache and cookies for `localhost:3000`

### "Username already taken" on first signup

**Cause**: A profile was created in a previous test.

**Solution**:
1. Go to Supabase Dashboard → Table Editor → `profiles`
2. Delete all rows
3. Go to **Authentication** → Users
4. Delete all test users
5. Try signing up again

### "Invalid login credentials"

**Cause**: You may have typed the wrong password, or the user doesn't exist.

**Solution**:
1. Try resetting: Go to Supabase Dashboard → Authentication → Users
2. Find your user and click the three dots → "Send password recovery"
3. Or delete the user and sign up again

### "Error: insert or update on table 'profiles' violates foreign key constraint"

**Cause**: The automatic profile creation trigger isn't working.

**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Run this query to check if the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
3. If no results, re-run the full migration from Step 5

## Next Steps

Congratulations! You have OpenSocial running locally. 🎉

### What You Can Do Now:

- Create posts (up to 280 characters)
- View all posts in chronological order
- See your profile info

### Coming in Week 2:

- Follow other users
- Timeline feed (see posts from people you follow)
- User profile pages
- Edit your profile

## Deployment (Optional)

### Deploy to Vercel

1. Push your code to GitHub (if you cloned from the original repo, create your own)
2. Go to [https://vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click "Deploy"
7. Wait 2-3 minutes
8. Your app is live! 🚀

## Development Tips

### Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Type check
npx tsc --noEmit

# Format code
npx prettier --write .
```

### Database Management

```bash
# Create a new migration
supabase migration new migration_name

# View database logs
supabase db logs

# Reset database (WARNING: deletes all data)
supabase db reset
```

## Getting Help

- Check the [README.md](./README.md) for project overview
- See the full [12-week roadmap](../TWITTER_CLONE_MVP_PLAN.md)
- Open an issue on GitHub
- Join our Discord (coming soon!)

## Contributing

We welcome contributions! See the main README for how to contribute.

---

Built with ❤️ using Next.js and Supabase
