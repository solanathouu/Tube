-- Script de test pour vérifier que le trigger fonctionne

-- 1. Nettoyer les données de test précédentes (si elles existent)
DELETE FROM public.users WHERE email LIKE 'test%@example.com';

-- Note: On ne peut pas supprimer directement de auth.users via SQL
-- Il faut le faire via le dashboard Supabase ou l'API

-- 2. Afficher l'état actuel
SELECT 'Nombre d''utilisateurs dans auth.users:' as info, count(*) as count FROM auth.users
UNION ALL
SELECT 'Nombre d''utilisateurs dans public.users:', count(*) FROM public.users;

-- 3. Vérifier que le trigger existe
SELECT
  'Trigger: ' || trigger_name as info,
  'Table: ' || event_object_table as details
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Vérifier que la fonction existe
SELECT
  'Fonction: ' || proname as info,
  'Type: ' || prokind as details
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 5. Tester manuellement l'insertion dans public.users
-- (pour vérifier que la table accepte bien les insertions)
INSERT INTO public.users (
  id,
  email,
  username,
  xp,
  level,
  total_reports,
  total_votes,
  total_thanks_received,
  total_work_sessions,
  total_work_minutes,
  favorite_lines,
  badges
)
VALUES (
  gen_random_uuid(),
  'manual_test@example.com',
  'manual_test_user',
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[]
)
RETURNING id, email, username;

-- 6. Vérifier que l'insertion a fonctionné
SELECT
  'Test d''insertion manuelle réussi' as info,
  email,
  username
FROM public.users
WHERE email = 'manual_test@example.com';

-- 7. Nettoyer le test
DELETE FROM public.users WHERE email = 'manual_test@example.com';

-- 8. Afficher toutes les RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'reports')
ORDER BY tablename, policyname;
