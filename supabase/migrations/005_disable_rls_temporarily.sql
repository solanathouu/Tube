-- ATTENTION : Ceci désactive temporairement le RLS pour débugger
-- À N'UTILISER QUE POUR LE DÉVELOPPEMENT, PAS EN PRODUCTION

-- Désactiver RLS sur reports
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'reports');

COMMENT ON TABLE reports IS 'RLS temporairement désactivé pour debug';
COMMENT ON TABLE users IS 'RLS temporairement désactivé pour debug';
