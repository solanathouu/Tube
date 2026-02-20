-- Fix RLS Policy pour permettre la création de profils utilisateurs lors du signup

-- Supprimer l'ancienne policy qui était trop restrictive
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Créer une nouvelle policy qui permet l'insertion après l'authentification
CREATE POLICY "Users can create own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Alternative : Si le problème persiste, autoriser l'insertion pour tous les utilisateurs authentifiés
-- et vérifier l'ID côté application
DROP POLICY IF EXISTS "Allow authenticated users to insert their profile" ON users;
CREATE POLICY "Allow authenticated users to insert their profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);
