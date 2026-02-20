-- Script de debug pour comprendre pourquoi le signup échoue

-- 1. Vérifier combien d'utilisateurs sont dans auth.users
SELECT
  count(*) as total_auth_users,
  'Utilisateurs dans auth.users' as description
FROM auth.users;

-- 2. Vérifier combien d'utilisateurs sont dans public.users
SELECT
  count(*) as total_public_users,
  'Utilisateurs dans public.users' as description
FROM public.users;

-- 3. Lister tous les utilisateurs dans auth.users
SELECT
  id,
  email,
  created_at,
  raw_user_meta_data->>'username' as username
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. Lister tous les utilisateurs dans public.users
SELECT
  id,
  email,
  username,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 5. Vérifier s'il y a des utilisateurs dans auth.users qui ne sont PAS dans public.users
SELECT
  a.id,
  a.email,
  'Utilisateur dans auth.users mais PAS dans public.users' as status
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL;

-- 6. Vérifier si le trigger existe
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 7. Vérifier s'il y a des doublons d'ID dans public.users
SELECT
  id,
  count(*) as count
FROM public.users
GROUP BY id
HAVING count(*) > 1;
