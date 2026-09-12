-- ==========================================================
-- SCRIPT: Clear Users & Profiles (Reset to Clean Production)
-- ==========================================================
-- Run this in your Supabase Dashboard -> SQL Editor (or via psql)
-- to clear all registered users, profiles, and associated purchases.

-- 1. Optional: Clear related purchases and payments if desired
-- DELETE FROM public.payments;
-- DELETE FROM public.purchases;

-- 2. Clear all user profile data
DELETE FROM public.profiles;

-- 3. Clear Supabase Auth user accounts (requires service role / admin)
-- NOTE: In Supabase, auth.users cascades to public.profiles if foreign key is set
DELETE FROM auth.users;

-- 4. Verify clean state
SELECT count(*) AS total_profiles FROM public.profiles;
SELECT count(*) AS total_auth_users FROM auth.users;
