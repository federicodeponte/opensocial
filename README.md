# OpenSocial - Open Source Social Network

A privacy-focused, open-source social network built with Next.js 15 and Supabase. This is Week 1 of the MVP - basic posting and authentication functionality.

## Features (Week 1)

- ✅ User authentication (signup/login)
- ✅ Create text posts (280 characters)
- ✅ View all posts (chronological feed)
- ✅ User profiles (automatic creation)
- ✅ Real-time updates with React Query

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: React Query (TanStack Query)
- **UI Components**: Custom components with shadcn/ui patterns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase CLI (`npm install -g supabase`)
- Supabase account (https://supabase.com)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd opensocial
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   Create a new Supabase project at https://supabase.com/dashboard

4. **Configure environment variables**

   Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` with your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Run database migrations**

   Link your local project to Supabase:
   ```bash
   supabase link --project-ref your-project-ref
   ```

   Push the database schema:
   ```bash
   supabase db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **profiles**: User profiles (extends Supabase auth.users)
  - username, display_name, bio, avatar_url, etc.
  - Follower/following counts (denormalized)

- **posts**: User posts
  - content (280 char limit)
  - Engagement counts (likes, retweets, replies)
  - Support for replies and quote tweets

- **follows**: Follower relationships
  - Many-to-many relationship between profiles

### Row Level Security (RLS)

All tables have RLS policies enabled:
- Profiles: Viewable by all, editable by owner
- Posts: Viewable by all, creatable by authenticated users, editable/deletable by owner
- Follows: Viewable by all, creatable/deletable by follower

## Project Structure

```
opensocial/
├── app/
│   ├── (auth)/           # Authentication pages (login, signup)
│   ├── (app)/            # Main app pages (home, profile, etc.)
│   ├── api/              # API routes
│   └── layout.tsx        # Root layout
├── components/
│   ├── auth/             # Auth-related components
│   ├── posts/            # Post components (composer, feed, card)
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/
│   ├── auth/             # Supabase client configurations
│   ├── hooks/            # React Query hooks
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── supabase/
│   ├── migrations/       # Database migrations
│   └── functions/        # Edge Functions (future)
└── middleware.ts         # Auth middleware
```

## Week 1 Roadmap Complete ✅

- [x] Project setup
- [x] Database schema
- [x] Authentication (signup/login)
- [x] Post creation
- [x] Post feed
- [x] Middleware for route protection

## Coming in Week 2

- User profile pages
- Following system
- Timeline feed (posts from followed users)
- Profile editing

## Development

### Useful Commands

```bash
# Start dev server
npm run dev

# Type check
npm run build

# Generate TypeScript types from Supabase
supabase gen types typescript --local > lib/types/database.ts

# Create new migration
supabase migration new migration_name

# Reset local database
supabase db reset

# View logs
supabase functions logs
```

## Contributing

This project is open-source and welcomes contributions! See the full 12-week roadmap in `TWITTER_CLONE_MVP_PLAN.md`.

## License

MIT License - feel free to use this for your own projects!

## Links

- [Full MVP Plan](../TWITTER_CLONE_MVP_PLAN.md)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
