# Database Migrations

This directory contains SQL migration files for the MANGU Publishing database schema.

## Migration Files

Migrations are numbered sequentially and applied in order:

- `001_initial_schema.sql` - Base schema with users, books, orders, and reviews
- `002_add_events_and_blog.sql` - Events, book clubs, and blog functionality

## Running Migrations

### Using the migration script:

```bash
# Run all pending migrations
npm --prefix server run migrate

# Run a specific migration
psql $DATABASE_URL -f server/src/database/migrations/001_initial_schema.sql
```

### Manual application:

```bash
# Connect to database
psql $DATABASE_URL

# Run migration
\i server/src/database/migrations/001_initial_schema.sql
```

## Creating New Migrations

1. Create a new file with the next sequential number: `003_description.sql`
2. Include migration metadata in comments:
   ```sql
   -- Migration: 003 Description
   -- Description: What this migration does
   -- Author: Your Name
   -- Date: YYYY-MM-DD
   ```
3. Write idempotent SQL (use IF NOT EXISTS, IF EXISTS, etc.)
4. Test the migration on a dev database before applying to production
5. Document any breaking changes in the migration file

## Migration Best Practices

- **Idempotent**: Migrations should be safe to run multiple times
- **Reversible**: Include rollback instructions in comments
- **Tested**: Test on development environment first
- **Documented**: Include clear descriptions and comments
- **Indexed**: Add indexes for foreign keys and frequently queried columns
- **Constrained**: Use appropriate constraints and validation

## Schema Standards

- Use `UUID` for primary keys
- Use `TIMESTAMP WITH TIME ZONE` for timestamps
- Include `created_at` and `updated_at` on most tables
- Use ENUMs for fixed value sets
- Add indexes for foreign keys and search columns
- Use JSONB for flexible structured data

## Rollback

To rollback a migration, create a new migration that reverses the changes.
Never modify existing migration files after they've been applied to production.

Example:
```sql
-- Migration: 004 Rollback Events
-- Description: Removes events and blog tables from migration 002

DROP TABLE IF EXISTS blog_comments CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS book_club_members CASCADE;
DROP TABLE IF EXISTS book_clubs CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
```

## Production Deployment

Before deploying migrations to production:

1. ✅ Test migration on local development database
2. ✅ Test migration on staging environment
3. ✅ Backup production database
4. ✅ Schedule maintenance window if needed
5. ✅ Run migration during low-traffic period
6. ✅ Verify data integrity after migration
7. ✅ Monitor application logs for errors

## Emergency Procedures

If a migration causes issues in production:

1. **Assess impact**: Check error logs and application health
2. **Quick fix**: If possible, apply a hotfix migration
3. **Rollback**: Create and apply a rollback migration
4. **Restore**: Use database backup if necessary
5. **Post-mortem**: Document what went wrong and how to prevent it

## Contact

For questions about database migrations, contact the infrastructure team.
