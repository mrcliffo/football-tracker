-- Run this query in Supabase SQL Editor to diagnose RLS policy issues

-- Check all policies on matches table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'matches'
ORDER BY policyname;

-- Check all policies on teams table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'teams'
ORDER BY policyname;

-- Check if privacy_settings column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'players'
AND column_name = 'privacy_settings';

-- Check if parent_children_view exists
SELECT table_name
FROM information_schema.views
WHERE table_name = 'parent_children_view';

-- Check if find_user_by_email function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'find_user_by_email';

-- Count policies by table
SELECT
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
