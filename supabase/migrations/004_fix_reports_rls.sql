-- Fix RLS Policies pour la table reports

-- Supprimer les anciennes policies restrictives
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Anyone can view reports" ON reports;
DROP POLICY IF EXISTS "Users can update reports for voting" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Policy pour LIRE les signalements (SELECT)
-- Tous les utilisateurs authentifiés peuvent voir tous les signalements
CREATE POLICY "Enable read access for authenticated users"
  ON reports FOR SELECT
  TO authenticated
  USING (true);

-- Policy pour CRÉER des signalements (INSERT)
-- Tous les utilisateurs authentifiés peuvent créer des signalements
CREATE POLICY "Enable insert for authenticated users"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pour MODIFIER des signalements (UPDATE)
-- Utilisé pour les votes et les remerciements
-- Tous les utilisateurs authentifiés peuvent modifier n'importe quel signalement
CREATE POLICY "Enable update for authenticated users"
  ON reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy pour SUPPRIMER des signalements (DELETE)
-- Seulement l'auteur peut supprimer son propre signalement
CREATE POLICY "Enable delete for users based on author_id"
  ON reports FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

COMMENT ON POLICY "Enable read access for authenticated users" ON reports IS 'Permet à tous les utilisateurs authentifiés de voir les signalements';
COMMENT ON POLICY "Enable insert for authenticated users" ON reports IS 'Permet à tous les utilisateurs authentifiés de créer des signalements';
COMMENT ON POLICY "Enable update for authenticated users" ON reports IS 'Permet à tous les utilisateurs authentifiés de voter et remercier';
COMMENT ON POLICY "Enable delete for users based on author_id" ON reports IS 'Permet seulement à l''auteur de supprimer son propre signalement';
