# Production Deployment Guide

Complete checklist and procedures for deploying OpenSocial to production.

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] All ESLint warnings fixed (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log/debugger statements in production code
- [ ] All TODOs addressed or documented

### Testing
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Critical user flows tested manually
- [ ] Mobile responsiveness verified
- [ ] Dark mode tested
- [ ] Cross-browser compatibility checked (Chrome, Firefox, Safari)

### Performance
- [ ] Lighthouse score > 90
- [ ] Images optimized and compressed
- [ ] Database indexes in place
- [ ] Materialized views created
- [ ] Query performance verified (< 100ms)

### Security
- [ ] Environment variables not committed to git
- [ ] API keys stored in environment variables
- [ ] RLS policies enabled on all tables
- [ ] Input validation on all API routes
- [ ] CORS configured correctly
- [ ] Rate limiting implemented (if needed)

### Database
- [ ] All migrations applied to production
- [ ] Database backups configured
- [ ] Connection pooling enabled
- [ ] Materialized views refresh scheduled

### Configuration
- [ ] Production environment variables set
- [ ] Supabase production project configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

---

## Environment Variables

### Required Variables

**Frontend (.env.local or Vercel Environment Variables):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Optional: Giphy API
NEXT_PUBLIC_GIPHY_API_KEY=your-giphy-api-key

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

**Backend (Supabase Secrets):**
```bash
# Supabase project settings > API > Project API keys
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: External APIs
GIPHY_API_KEY=your-giphy-api-key
```

---

## Deployment Steps

### 1. Database Setup

```bash
# Apply all migrations
cd supabase
supabase db push

# Create materialized views
supabase db execute -f migrations/20251117220000_add_materialized_views.sql

# Verify indexes
supabase db execute -f migrations/20251117147000_optimize_indexes.sql

# Set up automatic view refresh (requires pg_cron)
# Run this SQL in Supabase Dashboard:
SELECT cron.schedule(
  'refresh-materialized-views',
  '*/5 * * * *',
  'SELECT refresh_performance_views();'
);
```

### 2. Vercel Deployment

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Deploy to production
vercel --prod

# Verify deployment
vercel ls
```

### 3. Configure Custom Domain (Optional)

```bash
# Add domain to Vercel
vercel domains add yourdomain.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
# Add A record: @ -> 76.76.21.21

# Verify SSL
# SSL is automatically configured by Vercel
```

### 4. Set Up Monitoring

**Error Monitoring:**
- Set up error logging endpoint: `/api/monitoring/errors`
- Configure error alerts (email, Slack, etc.)
- Review error logs daily

**Performance Monitoring:**
- Enable Vercel Analytics (automatic)
- Monitor API response times
- Track database query performance

**Uptime Monitoring:**
- Use UptimeRobot or similar service
- Monitor `/` and `/api/health` endpoints
- Set up alerts for downtime

---

## Post-Deployment Verification

### Smoke Tests

1. **Homepage loads:** Visit production URL
2. **Authentication works:** Test login/signup
3. **Create post:** Verify post creation
4. **Like/retweet:** Test interactions
5. **Dark mode:** Toggle theme
6. **Explore page:** Check trending content
7. **Mobile view:** Test on mobile device
8. **API health:** Check `/api/health`

### Performance Checks

```bash
# Run Lighthouse audit
npx lighthouse https://yourdomain.com --view

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/posts

# Verify database performance
# Run in Supabase SQL Editor:
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Monitoring Dashboard

Access and verify:
- Vercel Analytics: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Error logs: `/api/monitoring/errors`

---

## Rollback Procedure

If issues arise after deployment:

```bash
# Rollback to previous deployment
vercel rollback

# Or redeploy specific commit
git checkout <previous-commit>
vercel --prod
```

### Database Rollback

```bash
# Rollback last migration
supabase migration rollback

# Restore from backup (if needed)
# Use Supabase Dashboard > Database > Backups
```

---

## Maintenance

### Daily Tasks
- [ ] Review error logs
- [ ] Check API response times
- [ ] Monitor database performance
- [ ] Review user feedback

### Weekly Tasks
- [ ] Database backup verification
- [ ] Performance audit
- [ ] Security scan
- [ ] Dependency updates check

### Monthly Tasks
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] User analytics review
- [ ] Feature usage analysis

---

## Scaling Considerations

### Database Scaling

**When to scale:**
- Query times > 200ms consistently
- Database CPU > 70%
- Connection pool saturated

**How to scale:**
1. Upgrade Supabase plan
2. Enable connection pooling
3. Add read replicas
4. Implement Redis caching

### Frontend Scaling

Vercel automatically scales, but monitor:
- Edge function execution time
- Build times
- Bandwidth usage

### Performance Optimization

**If experiencing slowness:**
1. Check materialized view refresh
2. Verify indexes are being used
3. Enable query caching
4. Optimize image delivery (CDN)
5. Implement Redis for hot data

---

## Emergency Contacts

**Critical Issues:**
- Database down: Check Supabase status page
- Vercel down: Check Vercel status page
- DNS issues: Check domain registrar

**Support Resources:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Community Discord: [Your Discord Link]

---

## Continuous Deployment

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID}}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID}}
          vercel-args: '--prod'
```

---

## Troubleshooting

### Common Issues

**Build Failures:**
- Check TypeScript errors: `npm run type-check`
- Check environment variables
- Clear cache: `rm -rf .next && npm run build`

**Database Connection Issues:**
- Verify connection string
- Check Supabase project status
- Verify network connectivity

**Slow Performance:**
- Check materialized view refresh
- Verify indexes
- Monitor database CPU/memory
- Check CDN configuration

**API Errors:**
- Check error logs
- Verify environment variables
- Check API rate limits
- Verify CORS configuration

---

## Success Metrics

Track these metrics post-deployment:

**Performance:**
- Time to Interactive (TTI): < 2s
- First Contentful Paint (FCP): < 1s
- API response time: < 200ms
- Database query time: < 100ms

**Reliability:**
- Uptime: > 99.9%
- Error rate: < 0.1%
- Failed requests: < 1%

**User Experience:**
- Bounce rate: < 40%
- Average session duration: > 3min
- Pages per session: > 5

---

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch for errors and performance issues
2. **Gather user feedback** - Set up feedback form
3. **Optimize based on metrics** - Use analytics to improve
4. **Plan next features** - Based on user requests
5. **Regular updates** - Weekly deployments for improvements

🚀 **You're ready to deploy!**
