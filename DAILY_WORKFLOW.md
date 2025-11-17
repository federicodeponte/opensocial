# Daily Workflow & Quick Start Guide 🎯

## Pre-Work Checklist (Every Day)

### 1. Environment Setup (5 min)
```bash
# Start services
npx supabase start
npm run dev

# Check status
npx supabase status
git status

# Pull latest changes
git pull origin main
```

### 2. Verify Everything Works (5 min)
```bash
# Type check
npx tsc --noEmit

# Run tests
npm run test

# Check build
npm run build
```

### 3. Review Day's Plan (10 min)
- [ ] Read day's goals from WEEK_PLAN_ADVANCED.md
- [ ] Check FEATURE_PRIORITY_MATRIX.md for priorities
- [ ] Create daily todo list
- [ ] Set up work environment (music, coffee, focus)

---

## Day 8 Quick Start: Performance & Real-time

### Morning Sprint (9 AM - 12 PM)
**Goal: Infinite scroll + Image optimization**

#### Task 1: Infinite Scroll (2h)
```bash
# Files to create/edit:
- lib/hooks/usePosts.ts (add useInfiniteQuery)
- components/posts/InfiniteFeed.tsx (new component)
- app/(app)/home/page.tsx (replace with InfiniteFeed)

# Steps:
1. Update usePosts hook with useInfiniteQuery
2. Add IntersectionObserver for auto-load
3. Add loading spinner at bottom
4. Test with 100+ posts
```

#### Task 2: Image Optimization (2h)
```bash
# Files to edit:
- components/posts/PostCard.tsx (use next/image)
- components/posts/ImageGallery.tsx (use next/image)
- components/profiles/ProfilePage.tsx (optimize images)
- next.config.js (configure image domains)

# Steps:
1. Replace <img> with Next.js Image
2. Add blur placeholders
3. Configure Supabase domain
4. Test lazy loading
```

**Deliverable Check:**
- [ ] Feed scrolls infinitely
- [ ] No pagination buttons
- [ ] Images load progressively
- [ ] Lighthouse performance: 85+

---

### Afternoon Sprint (1 PM - 5 PM)
**Goal: Real-time updates + Optimistic UI**

#### Task 3: Supabase Realtime (3h)
```bash
# Files to create/edit:
- lib/hooks/useRealtimeSubscription.ts (new hook)
- components/notifications/NotificationBell.tsx (add realtime)
- app/(app)/home/page.tsx (subscribe to new posts)
- components/messages/MessageList.tsx (realtime DMs)

# Steps:
1. Create realtime subscription hook
2. Subscribe to posts table
3. Update feed when new posts arrive
4. Add toast notifications
5. Test with multiple browser windows
```

#### Task 4: Optimistic Updates (2h)
```bash
# Files to edit:
- lib/hooks/usePosts.ts (optimistic create)
- lib/hooks/useLike.ts (optimistic toggle)
- lib/hooks/useFollow.ts (optimistic follow)

# Steps:
1. Add optimistic updates to mutations
2. Handle rollback on error
3. Add loading states
4. Test error scenarios
```

**Deliverable Check:**
- [ ] New posts appear instantly
- [ ] Likes work instantly
- [ ] Follows feel instant
- [ ] Errors rollback correctly

---

## Day 9 Quick Start: Advanced Social Features

### Morning Sprint (9 AM - 12 PM)
**Goal: Mentions + Verified badges**

#### Task 1: Mentions System (4h)
```bash
# Database migration first:
- supabase/migrations/YYYYMMDDHHMMSS_add_mentions.sql

# Files to create/edit:
- components/posts/MentionAutocomplete.tsx (new)
- components/posts/PostComposer.tsx (add autocomplete)
- lib/utils/mentionParser.ts (extract mentions)
- app/api/posts/route.ts (save mentions)

# Steps:
1. Create mentions table
2. Build autocomplete component
3. Extract @mentions from content
4. Save mentions on post creation
5. Link mentions in displayed posts
6. Create mention notifications
```

#### Task 2: Verified Badges (1h)
```bash
# Database migration:
- supabase/migrations/YYYYMMDDHHMMSS_add_verified.sql

# Files to edit:
- components/profiles/ProfilePage.tsx (show badge)
- components/posts/PostCard.tsx (show on posts)
- components/ui/VerifiedBadge.tsx (new component)

# Steps:
1. Add verified column to profiles
2. Create badge component
3. Display on profiles and posts
4. Add admin verification endpoint
```

**Deliverable Check:**
- [ ] @mention autocomplete works
- [ ] Mentions link to profiles
- [ ] Verified badges display
- [ ] Notifications for mentions

---

### Afternoon Sprint (1 PM - 5 PM)
**Goal: Rich text editor + Engagement features**

#### Task 3: Rich Text Editor (4h)
```bash
# Install dependencies:
npm install react-markdown remark-gfm

# Files to create/edit:
- components/posts/RichTextEditor.tsx (new)
- components/posts/PostContent.tsx (markdown rendering)
- components/posts/PostComposer.tsx (integrate editor)

# Steps:
1. Add markdown toolbar
2. Bold, italic, code formatting
3. Link preview
4. Render markdown in posts
5. Sanitize HTML
```

#### Task 4: Emoji Picker (1h)
```bash
# Install dependency:
npm install emoji-picker-react

# Files to edit:
- components/posts/PostComposer.tsx (add emoji button)
- components/posts/EmojiPicker.tsx (new wrapper)

# Steps:
1. Add emoji picker component
2. Insert emoji at cursor
3. Mobile-friendly positioning
```

**Deliverable Check:**
- [ ] Markdown formatting works
- [ ] Links render as previews
- [ ] Emoji picker functional
- [ ] Mobile-friendly

---

## Daily Workflow Template

### 🌅 Morning (9 AM - 12 PM)
1. **Standup** (10 min)
   - What did I do yesterday?
   - What will I do today?
   - Any blockers?

2. **Implementation** (2h 30min)
   - Focus on high-impact features
   - No interruptions (deep work)

3. **Testing** (20 min)
   - Test new features
   - Manual QA
   - Fix obvious bugs

---

### 🌞 Afternoon (1 PM - 5 PM)
1. **Lunch Break** (1 hour)

2. **Implementation** (2h 30min)
   - Continue with planned features
   - Integration work

3. **Code Review** (30 min)
   - Review own code
   - Refactor if needed
   - Update documentation

---

### 🌙 Evening (6 PM - 8 PM)
1. **Final Testing** (30 min)
   - Build verification
   - E2E happy path test
   - Performance check

2. **Documentation** (30 min)
   - Update README if needed
   - Add code comments
   - Update todo list

3. **Commit & Deploy** (30 min)
   ```bash
   # Commit work
   git add .
   git commit -m "feat: [feature name]"
   git push origin main

   # Deploy preview
   # Vercel auto-deploys on push
   ```

4. **Planning** (30 min)
   - Review today's accomplishments
   - Plan tomorrow's work
   - Update project board

---

## Commit Message Convention

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `test`: Add/update tests
- `docs`: Documentation
- `style`: Code style (formatting)
- `chore`: Maintenance tasks

### Examples
```bash
git commit -m "feat(search): add infinite scroll to search results"
git commit -m "fix(posts): resolve image loading issue on mobile"
git commit -m "perf(feed): optimize feed query with indexes"
git commit -m "test(auth): add unit tests for login flow"
```

---

## Testing Checklist (Before Each Commit)

### Automated Tests
```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Unit tests
npm run test

# Build
npm run build
```

### Manual Tests
- [ ] Feature works in Chrome
- [ ] Feature works in Safari (if UI-heavy)
- [ ] Mobile responsive (toggle device toolbar)
- [ ] Keyboard accessible
- [ ] Loading states work
- [ ] Error states work
- [ ] Empty states work

---

## Quick Commands Reference

### Development
```bash
# Start everything
npm run dev
npx supabase start

# Stop everything
npx supabase stop

# Reset database
npx supabase db reset --local

# Generate types
npx supabase gen types --lang=typescript --local 2>/dev/null > lib/types/database.ts

# Run specific test
npm run test -- ComponentName
```

### Database
```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db reset --local

# View database in browser
npx supabase db start
# Then open: http://localhost:54323
```

### Deployment
```bash
# Deploy to Vercel
git push origin main
# Auto-deploys via GitHub integration

# Manual deploy
vercel --prod

# Check deployment
vercel ls
```

---

## Troubleshooting Quick Fixes

### "Supabase not running"
```bash
npx supabase stop
npx supabase start
```

### "Type errors after migration"
```bash
npx supabase gen types --lang=typescript --local 2>/dev/null > lib/types/database.ts
```

### "Port already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port
PORT=3001 npm run dev
```

### "Build failing"
```bash
# Clear cache
rm -rf .next
npm run build
```

### "Database out of sync"
```bash
npx supabase db reset --local
```

---

## Focus Techniques

### Pomodoro (25 min work, 5 min break)
1. Set timer for 25 minutes
2. Work on single task
3. Take 5-minute break
4. Repeat 4 times, then 15-minute break

### Deep Work Blocks (2 hours)
1. Silence notifications
2. Close Slack/email
3. Put on focus music
4. Single task only
5. Mini break every hour

---

## End of Day Ritual

### Before Logging Off
1. **Commit all work** (even if incomplete)
2. **Update todo list** for tomorrow
3. **Write brief notes** on what's done
4. **Close all tabs** and reset workspace
5. **Celebrate wins** 🎉

### Daily Log Template
```markdown
## Day X - [Date]

### Completed ✅
- [x] Feature 1
- [x] Feature 2

### In Progress 🚧
- [ ] Feature 3 (50% done)

### Blockers ⚠️
- Issue with XYZ (workaround: ...)

### Tomorrow's Focus 🎯
1. Complete Feature 3
2. Start Feature 4
3. Write tests for Features 1-3

### Notes 📝
- Learned: ...
- Ideas: ...
- Questions: ...
```

---

## Motivation & Mindset

### Daily Mantras
- "Progress over perfection"
- "Ship features, iterate later"
- "One feature at a time"
- "Test early, test often"

### When Stuck (> 30 min)
1. Take a break (walk, coffee)
2. Rubber duck debugging
3. Check documentation
4. Ask Claude Code for help
5. Move to different task, come back later

---

## Quick Reference: File Locations

### Common Files
```
Authentication:
- lib/auth/supabase-server.ts

Posts:
- lib/hooks/usePosts.ts
- components/posts/PostCard.tsx
- app/api/posts/route.ts

Profiles:
- lib/hooks/useProfile.ts
- components/profiles/ProfilePage.tsx
- app/api/profiles/[username]/route.ts

Database:
- supabase/migrations/*.sql
- lib/types/database.ts
```

---

Let's build something amazing! 🚀

**Remember:**
- Focus on value, not perfection
- Test as you go
- Document for future you
- Ship every day
- Have fun! 😊
