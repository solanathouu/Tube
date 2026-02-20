-- ============================================
-- MIGRATION FINALE POUR CORRIGER L'AUTHENTIFICATION
-- Exécutez ce script dans l'éditeur SQL du dashboard Supabase
-- ============================================

-- 1. DÉSACTIVER temporairement RLS pour permettre les insertions
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les anciennes policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read for service role" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON users;

DROP POLICY IF EXISTS "Anyone can view reports" ON reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update reports for voting" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON reports;

-- 3. Supprimer l'ancien trigger si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Recréer la fonction trigger avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
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
  )
  ON CONFLICT (id) DO NOTHING;  -- Évite les erreurs si le profil existe déjà
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erreur création profil: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 7. Créer des policies SIMPLES et PERMISSIVES

-- USERS : Tout le monde peut lire, chacun peut modifier le sien
CREATE POLICY "users_select_all"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- REPORTS : Lecture pour tous, création/modification pour authentifiés
CREATE POLICY "reports_select_all"
  ON reports FOR SELECT
  USING (true);

CREATE POLICY "reports_insert_auth"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "reports_update_auth"
  ON reports FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "reports_delete_own"
  ON reports FOR DELETE
  USING (auth.uid() = author_id);

-- 8. Vérification
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'reports');

SELECT 'Policies:' as info;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'reports');

SELECT 'Trigger:' as info;
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';


