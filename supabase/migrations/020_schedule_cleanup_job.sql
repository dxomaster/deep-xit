-- Schedule cleanup to run every hour
-- This will delete all rooms and related data older than 1 hour
-- Note: pg_cron runs as the postgres user, so this should work with RLS disabled
select cron.schedule(
  'cleanup-old-data',
  '0 * * * *', -- Every hour at minute 0
  'select cleanup_old_data();'
);
