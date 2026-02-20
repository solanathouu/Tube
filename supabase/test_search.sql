-- Script de test pour vérifier la base de données et la recherche

-- 1. Vérifier tous les utilisateurs
SELECT 
  id, 
  email, 
  username, 
  phone_number,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 2. Chercher Nathan spécifiquement
SELECT 
  id, 
  email, 
  username, 
  phone_number
FROM public.users
WHERE email = 'protecpiscinespt@gmail.com';

-- 3. Tester la fonction de recherche (remplace USER_ID par ton vrai ID)
-- Pour trouver ton ID, regarde le résultat de la requête 1 ci-dessus
-- SELECT * FROM search_users_by_username('protec', 20);

-- 4. Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'friend_requests', 'friendships', 'share_permissions');

-- 5. Vérifier que la fonction existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'search_users_by_username';

