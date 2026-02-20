-- ============================================
-- MIGRATION : Ajout numéro de téléphone
-- ============================================

-- Ajouter phone_number à users si pas déjà présent
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='phone_number') THEN
    ALTER TABLE users ADD COLUMN phone_number TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
  END IF;
END $$;

-- Mettre à jour le trigger pour inclure phone_number
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
    phone_number,
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
    NEW.raw_user_meta_data->>'phone_number',
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
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erreur création profil: %', SQLERRM;
    RETURN NEW;
END;
$$;

