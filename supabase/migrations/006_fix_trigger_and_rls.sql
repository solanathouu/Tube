-- Migration pour corriger le trigger et les RLS policies

-- 1. Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Recréer la fonction avec une meilleure gestion d'erreur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer le profil utilisateur
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
    badges,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    NOW(),
    NOW()
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Logger l'erreur mais ne pas empêcher la création du compte
    RAISE WARNING 'Erreur création profil utilisateur: %', SQLERRM;
    RETURN new;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Supprimer toutes les policies RLS restrictives sur users
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 5. Activer RLS sur users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Créer des policies permissives pour users
CREATE POLICY "Enable all for authenticated users"
  ON users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable read for service role"
  ON users FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Enable insert for service role"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 7. Supprimer toutes les policies sur reports
DROP POLICY IF EXISTS "Authenticated users can read reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reports;
DROP POLICY IF EXISTS "Authors can update own reports" ON reports;
DROP POLICY IF EXISTS "Authors can delete own reports" ON reports;

-- 8. Activer RLS sur reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 9. Créer des policies permissives pour reports
CREATE POLICY "Enable all for authenticated users"
  ON reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 10. Ajouter un commentaire
COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function: crée automatiquement un profil dans public.users après inscription';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Appelle handle_new_user() pour créer le profil utilisateur';
