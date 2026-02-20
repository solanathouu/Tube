-- Script de debug pour vérifier l'état des policies RLS

-- 1. Vérifier les policies sur la table users
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
WHERE tablename = 'users'
ORDER BY policyname;

-- 2. Vérifier les policies sur la table reports
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
WHERE tablename = 'reports'
ORDER BY policyname;

-- 3. Vérifier si RLS est activé
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'reports');

-- 4. Vérifier les triggers
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('users')
ORDER BY trigger_name;

-- 5. Vérifier qu'il y a bien des utilisateurs dans auth.users
SELECT
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 6. Vérifier qu'il y a bien des utilisateurs dans public.users
SELECT
  id,
  email,
  username,
  xp,
  level,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
