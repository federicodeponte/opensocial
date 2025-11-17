# Performance Optimization Guide

This document outlines the performance optimizations implemented in OpenSocial and how to use them effectively.

## Database Optimizations

### Indexes

All critical queries have composite indexes for optimal performance:

**Posts Table:**
- `idx_posts_user_created` - User's posts ordered by date
- `idx_posts_replies` - Replies to a post
- `idx_posts_quotes` - Quote tweets

**Social Graph:**
- `idx_follows_relationship` - Check if user A follows user B
- `idx_follows_following_created` - User's followers list
- `idx_follows_follower_created` - User's following list

**Engagement:**
- `idx_likes_post_user` - Check if user liked post
- `idx_retweets_post_user` - Check if user retweeted

**Search:**
- `idx_profiles_search` - Full-text search on profiles
- `idx_profiles_username_lower` - Case-insensitive username lookup

### Materialized Views

Pre-computed views for expensive queries:

**trending_posts_cache:**
- Refreshed every 5 minutes
- Pre-calculates trending scores
- Includes engagement counts
- Usage: `SELECT * FROM trending_posts_cache ORDER BY trending_score DESC LIMIT 10`

**user_stats_cache:**
- Refreshed every 5 minutes
- Pre-calculates follower/following counts
- Includes total engagement received
- Usage: `SELECT * FROM user_stats_cache WHERE user_id = 'xxx'`

**Manual Refresh:**
```sql
SELECT refresh_performance_views();
```

**Automatic Refresh (requires pg_cron):**
```sql
SELECT cron.schedule('refresh-views', '*/5 * * * *', 'SELECT refresh_performance_views();');
```

## Query Optimization Utilities

### Data Loaders (Batch Loading)

Reduces N+1 queries by batching multiple single-record requests:

```typescript
import { createProfileLoader } from '@/lib/utils/query-optimizer'

const profileLoader = createProfileLoader(supabase)

// These will be batched into a single query
const profile1 = await profileLoader.load(userId1)
const profile2 = await profileLoader.load(userId2)
const profile3 = await profileLoader.load(userId3)
```

### TTL Cache

In-memory cache with automatic expiration:

```typescript
import { cacheQuery } from '@/lib/utils/query-optimizer'

const trendingPosts = await cacheQuery(
  'trending-posts',
  async () => {
    const { data } = await supabase.from('trending_posts_cache').select('*')
    return data
  },
  5 * 60 * 1000 // 5 minutes
)
```

## Performance Monitoring

### Measure Query Times

```typescript
import { measureTime } from '@/lib/utils/performance'

const { result, duration } = await measureTime('fetch-posts', async () => {
  return await supabase.from('posts').select('*')
})

console.log(`Query took ${duration}ms`)
```

### Performance Tracker

```typescript
import { perfTracker } from '@/lib/utils/performance'

perfTracker.mark('start-query')
// ... do work
const duration = perfTracker.measure('my-query', 'start-query')

// Get statistics
const stats = perfTracker.getStats('my-query')
// { avg: 45.2, min: 23.1, max: 89.4, count: 10 }
```

### Utility Functions

```typescript
import {
  debounce,
  throttle,
  memoize,
  retryWithBackoff,
} from '@/lib/utils/performance'

// Debounce - wait for user to stop typing
const debouncedSearch = debounce(search, 300)

// Throttle - limit execution frequency
const throttledScroll = throttle(onScroll, 100)

// Memoize - cache function results
const expensiveCalc = memoize((x, y) => x * y * Math.random())

// Retry with exponential backoff
const data = await retryWithBackoff(
  () => fetch('/api/data'),
  3, // max retries
  1000 // base delay (ms)
)
```

## Image Optimization

### Client-Side Compression

```typescript
import { compressImage } from '@/lib/utils/image-upload'

const compressed = await compressImage(
  file,
  1200, // max width
  1200, // max height
  0.8 // quality (0-1)
)
```

### Blur Placeholders

```typescript
import { generateBlurPlaceholder } from '@/lib/utils/image-upload'

const blurDataUrl = await generateBlurPlaceholder(file)
// Use in Next.js Image component
<Image src={url} placeholder="blur" blurDataURL={blurDataUrl} />
```

### CDN Optimization

```typescript
import { getOptimizedImageUrl } from '@/lib/utils/image-upload'

const optimized = getOptimizedImageUrl(imageUrl, {
  width: 800,
  quality: 80,
  format: 'webp',
})
```

## Best Practices

### Database Queries

1. **Always use indexes** - Check EXPLAIN ANALYZE for slow queries
2. **Limit results** - Use LIMIT and pagination
3. **Select only needed fields** - Don't use SELECT *
4. **Use materialized views** - For complex aggregations
5. **Batch queries** - Use data loaders for N+1 problems

### API Routes

1. **Cache expensive queries** - Use TTL cache
2. **Implement pagination** - Cursor or offset-based
3. **Validate input early** - Fail fast
4. **Use React Query** - Automatic caching and deduplication
5. **Measure performance** - Log slow queries

### Frontend

1. **Lazy load images** - Use Next.js Image component
2. **Compress before upload** - Reduce bandwidth
3. **Use skeleton screens** - Better perceived performance
4. **Debounce user input** - Reduce API calls
5. **Virtualize long lists** - Only render visible items

### React Query Configuration

```typescript
// lib/react-query-config.ts
{
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 30, // 30 minutes
  refetchOnWindowFocus: false,
  retry: 1,
}
```

## Performance Targets

### API Response Times

- **< 100ms** - Database queries with indexes
- **< 200ms** - API routes (simple)
- **< 500ms** - API routes (complex)
- **< 1s** - Page loads (Time to Interactive)

### Database

- **< 50ms** - Indexed queries
- **< 100ms** - Materialized view queries
- **< 200ms** - Full-text search
- **< 500ms** - Complex aggregations

### Frontend

- **< 1s** - First Contentful Paint (FCP)
- **< 2s** - Time to Interactive (TTI)
- **< 100ms** - Input latency
- **90+** - Lighthouse Performance Score

## Monitoring in Production

### Enable Performance Tracking

```typescript
// In API routes
import { perfTracker, logSlowQuery } from '@/lib/utils/performance'

const { result, duration } = await measureTime('my-query', async () => {
  return await supabase.from('posts').select('*')
})

logSlowQuery('my-query', duration, 100) // Log if > 100ms
```

### Database Monitoring

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Troubleshooting

### Slow Queries

1. Run `EXPLAIN ANALYZE` to see query plan
2. Check if indexes are being used
3. Consider adding composite indexes
4. Use materialized views for complex queries
5. Implement caching

### High Memory Usage

1. Clear cache periodically: `queryCache.clear()`
2. Reduce cache TTL
3. Limit result set sizes
4. Use pagination instead of loading all results

### N+1 Query Problems

1. Use data loaders to batch queries
2. Use Supabase's `select` with joins
3. Pre-load related data
4. Cache frequently accessed data

## Next Steps

- [ ] Set up Cloudflare Images CDN
- [ ] Implement Redis for distributed caching
- [ ] Add database connection pooling
- [ ] Set up APM (Application Performance Monitoring)
- [ ] Implement service workers for offline support
