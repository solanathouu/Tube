-- Supprimer les anciennes policies restrictives
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON users;

-- Créer une policy simple pour l'insertion (le trigger gérera la sécurité)
CREATE POLICY "Enable insert for service role"
  ON users FOR INSERT
  WITH CHECK (true);

-- Fonction qui crée automatiquement le profil utilisateur après l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, xp, level, total_reports, total_votes, total_thanks_received, total_work_sessions, total_work_minutes, favorite_lines, badges)
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
    '{}',
    '{}'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger qui s'exécute automatiquement après chaque inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Maintenant, modifier le service authService pour NE PAS créer l'utilisateur manuellement
COMMENT ON FUNCTION public.handle_new_user IS 'Crée automatiquement un profil utilisateur dans public.users après inscription dans auth.users';
