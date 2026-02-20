-- Migration pour corriger les utilisateurs existants qui n'ont pas de username
-- et s'assurer que tous les utilisateurs auth sont dans la table users

-- 1. S'assurer que tous les utilisateurs de auth.users sont dans public.users
INSERT INTO public.users (id, email, username, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    pu.username, 
    SPLIT_PART(au.email, '@', 1) || '_' || SUBSTRING(au.id::TEXT, 1, 6)
  ) AS username,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Mettre à jour les utilisateurs existants qui n'ont pas de username
UPDATE public.users
SET 
  username = SPLIT_PART(email, '@', 1) || '_' || SUBSTRING(id::TEXT, 1, 6),
  updated_at = NOW()
WHERE username IS NULL OR username = '';

-- 3. S'assurer que tous les usernames sont uniques
DO $$
DECLARE
  duplicate_record RECORD;
  user_record RECORD;
  new_username TEXT;
  counter INT;
BEGIN
  FOR duplicate_record IN
    SELECT username, ARRAY_AGG(id) as ids, COUNT(*) as cnt
    FROM public.users
    GROUP BY username
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    FOR user_record IN SELECT UNNEST(duplicate_record.ids[2:]) AS user_id
    LOOP
      new_username := duplicate_record.username || '_' || counter;
      UPDATE public.users
      SET username = new_username
      WHERE id = user_record.user_id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 4. Vérifier et afficher les utilisateurs
SELECT 
  id, 
  email, 
  username, 
  phone_number,
  created_at
FROM public.users
ORDER BY created_at DESC;

