-- Corriger les politiques RLS pour permettre la recherche d'utilisateurs

-- Supprimer les anciennes politiques restrictives si elles existent
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire les profils publics
CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique : Les utilisateurs peuvent insérer leur propre profil (via trigger)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Vérifier que tout est en place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

