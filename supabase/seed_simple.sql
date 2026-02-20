-- ============================================
-- SEED SIMPLE - Version sans contraintes auth.users
-- Exécuter dans le SQL Editor de Supabase Dashboard
-- ============================================

-- Désactiver temporairement RLS pour l'insertion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- ============================================
-- UTILISATEURS DE TEST
-- ============================================
INSERT INTO users (id, email, username, phone_number, xp, level, total_reports, total_votes, total_thanks_received, favorite_lines, badges, created_at)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'parisien92@tube.app', 'Parisien_92', '+33612345678', 2450, 3, 87, 234, 156, ARRAY['1', '14'], ARRAY['early_adopter', 'reporter_gold'], NOW() - INTERVAL '45 days'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'metro.watcher@tube.app', 'Metro_Watcher', '+33623456789', 4120, 4, 156, 412, 298, ARRAY['1', '4', '7'], ARRAY['early_adopter', 'reporter_gold', 'voter_gold'], NOW() - INTERVAL '60 days'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234', 'community.helper@tube.app', 'CommunityHelper', '+33634567890', 1890, 2, 42, 189, 87, ARRAY['14', '6'], ARRAY['reporter_silver'], NOW() - INTERVAL '30 days'),
  ('d4e5f6a7-b8c9-0123-defa-456789012345', 'alert75@tube.app', 'Alert_75', '+33645678901', 3580, 3, 98, 356, 201, ARRAY['1', '2', '9'], ARRAY['reporter_gold', 'voter_silver'], NOW() - INTERVAL '50 days'),
  ('e5f6a7b8-c9d0-1234-efab-567890123456', 'techsupport@tube.app', 'TechSupport', '+33656789012', 5200, 4, 178, 489, 342, ARRAY['3', '11', '14'], ARRAY['reporter_gold', 'voter_gold', 'top_contributor'], NOW() - INTERVAL '90 days'),
  ('f6a7b8c9-d0e1-2345-fabc-678901234567', 'safe.commute@tube.app', 'SafeCommute', '+33667890123', 975, 2, 28, 97, 45, ARRAY['6', '8'], ARRAY['reporter_bronze'], NOW() - INTERVAL '20 days'),
  ('07a8b9c0-e1f2-3456-abcd-789012345678', 'commuter.pro@tube.app', 'Commuter_Pro', '+33678901234', 2890, 3, 76, 287, 167, ARRAY['4', '12', '13'], ARRAY['reporter_silver', 'voter_silver'], NOW() - INTERVAL '40 days'),
  ('18b9c0d1-f2a3-4567-bcde-890123456789', 'realtime.alert@tube.app', 'RealTimeAlert', '+33689012345', 3100, 3, 89, 312, 189, ARRAY['1', '7', '14'], ARRAY['reporter_gold', 'speed_demon'], NOW() - INTERVAL '35 days'),
  ('29c0d1e2-a3b4-5678-cdef-901234567890', 'city.guardian@tube.app', 'CityGuardian', '+33690123456', 4450, 4, 134, 445, 278, ARRAY['2', '5', '9'], ARRAY['reporter_gold', 'voter_gold'], NOW() - INTERVAL '75 days'),
  ('3ad1e2f3-b4c5-6789-defa-012345678901', 'info.metro@tube.app', 'InfoMetro', '+33601234567', 1520, 2, 38, 152, 72, ARRAY['8', '10'], ARRAY['reporter_silver'], NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO UPDATE SET
  xp = EXCLUDED.xp,
  level = EXCLUDED.level,
  total_reports = EXCLUDED.total_reports,
  updated_at = NOW();

-- ============================================
-- SIGNALEMENTS ACTIFS
-- ============================================

-- Contrôleurs
INSERT INTO reports (type, station_id, station_name, line, coordinates, comment, author_id, author_username, author_level, author_xp, votes_present, votes_absent, thanks, status, created_at, expires_at)
VALUES
  ('controller', 'L1_15', 'Châtelet', '1', ST_SetSRID(ST_MakePoint(2.3474, 48.8583), 4326)::geography,
   'Équipe de 4 personnes à la sortie principale côté Les Halles',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Parisien_92', 3, 2450,
   ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', 'c3d4e5f6-a7b8-9012-cdef-345678901234']::UUID[],
   ARRAY[]::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[],
   'active', NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '25 minutes'),

  ('controller', 'L1_19', 'Gare de Lyon', '1', ST_SetSRID(ST_MakePoint(2.3736, 48.8442), 4326)::geography,
   'Contrôle en cours côté RER A, équipe mobile',
   'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Metro_Watcher', 4, 4120,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-567890123456', 'd4e5f6a7-b8c9-0123-defa-456789012345']::UUID[],
   ARRAY[]::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-567890123456']::UUID[],
   'active', NOW() - INTERVAL '12 minutes', NOW() + INTERVAL '18 minutes'),

  ('controller', 'L14_9', 'Châtelet', '14', ST_SetSRID(ST_MakePoint(2.3474, 48.8583), 4326)::geography,
   'Grande équipe ligne 14, contrôle systématique à la descente',
   '18b9c0d1-f2a3-4567-bcde-890123456789', 'RealTimeAlert', 3, 3100,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'd4e5f6a7-b8c9-0123-defa-456789012345']::UUID[],
   ARRAY[]::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[],
   'active', NOW() - INTERVAL '3 minutes', NOW() + INTERVAL '27 minutes'),

  ('controller', 'L4_6', 'Gare du Nord', '4', ST_SetSRID(ST_MakePoint(2.3553, 48.8809), 4326)::geography,
   'Équipe de 3 à la correspondance RER B/D',
   'd4e5f6a7-b8c9-0123-defa-456789012345', 'Alert_75', 3, 3580,
   ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', '07a8b9c0-e1f2-3456-abcd-789012345678', '29c0d1e2-a3b4-5678-cdef-901234567890']::UUID[],
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890']::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[],
   'active', NOW() - INTERVAL '6 minutes', NOW() + INTERVAL '24 minutes'),

  ('controller', 'L1_7', 'Charles de Gaulle - Étoile', '1', ST_SetSRID(ST_MakePoint(2.2950, 48.8738), 4326)::geography,
   'Patrouille mobile entre correspondances lignes 1/2/6',
   '29c0d1e2-a3b4-5678-cdef-901234567890', 'CityGuardian', 4, 4450,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'e5f6a7b8-c9d0-1234-efab-567890123456']::UUID[],
   ARRAY[]::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-456789012345']::UUID[],
   'active', NOW() - INTERVAL '4 minutes', NOW() + INTERVAL '26 minutes'),

  ('controller', 'L7_17', 'Pyramides', '7', ST_SetSRID(ST_MakePoint(2.3333, 48.8662), 4326)::geography,
   'Équipe de 2, contrôle à la montée direction La Courneuve',
   'e5f6a7b8-c9d0-1234-efab-567890123456', 'TechSupport', 4, 5200,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', '07a8b9c0-e1f2-3456-abcd-789012345678']::UUID[],
   ARRAY[]::UUID[], ARRAY[]::UUID[],
   'active', NOW() - INTERVAL '9 minutes', NOW() + INTERVAL '21 minutes');

-- Incidents
INSERT INTO reports (type, station_id, station_name, line, coordinates, comment, author_id, author_username, author_level, author_xp, votes_present, votes_absent, thanks, status, created_at, expires_at)
VALUES
  ('incident', 'L14_10', 'Gare de Lyon', '14', ST_SetSRID(ST_MakePoint(2.3736, 48.8442), 4326)::geography,
   'Retard important (~10min), affluence sur les quais direction Olympiades',
   'c3d4e5f6-a7b8-9012-cdef-345678901234', 'CommunityHelper', 2, 1890,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'e5f6a7b8-c9d0-1234-efab-567890123456', '07a8b9c0-e1f2-3456-abcd-789012345678', '18b9c0d1-f2a3-4567-bcde-890123456789']::UUID[],
   ARRAY[]::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'e5f6a7b8-c9d0-1234-efab-567890123456']::UUID[],
   'active', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '15 minutes'),

  ('incident', 'L7_8', 'Stalingrad', '7', ST_SetSRID(ST_MakePoint(2.3673, 48.8838), 4326)::geography,
   'Colis suspect signalé, évacuation partielle quai direction Villejuif',
   '07a8b9c0-e1f2-3456-abcd-789012345678', 'Commuter_Pro', 3, 2890,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'd4e5f6a7-b8c9-0123-defa-456789012345', '29c0d1e2-a3b4-5678-cdef-901234567890']::UUID[],
   ARRAY[]::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'd4e5f6a7-b8c9-0123-defa-456789012345']::UUID[],
   'active', NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '20 minutes'),

  ('incident', 'L1_9', 'Franklin D. Roosevelt', '1', ST_SetSRID(ST_MakePoint(2.3099, 48.8689), 4326)::geography,
   'Trains irréguliers suite à un malaise voyageur, attente prolongée',
   'e5f6a7b8-c9d0-1234-efab-567890123456', 'TechSupport', 4, 5200,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c3d4e5f6-a7b8-9012-cdef-345678901234', '07a8b9c0-e1f2-3456-abcd-789012345678']::UUID[],
   ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890']::UUID[],
   'active', NOW() - INTERVAL '7 minutes', NOW() + INTERVAL '23 minutes'),

  ('incident', 'L13_4', 'Carrefour Pleyel', '13', ST_SetSRID(ST_MakePoint(2.3442, 48.9215), 4326)::geography,
   'Altercation entre voyageurs, présence sécurité RATP',
   '29c0d1e2-a3b4-5678-cdef-901234567890', 'CityGuardian', 4, 4450,
   ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', 'd4e5f6a7-b8c9-0123-defa-456789012345']::UUID[],
   ARRAY[]::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[],
   'active', NOW() - INTERVAL '8 minutes', NOW() + INTERVAL '22 minutes');

-- Maintenance
INSERT INTO reports (type, station_id, station_name, line, coordinates, comment, author_id, author_username, author_level, author_xp, votes_present, votes_absent, thanks, status, created_at, expires_at)
VALUES
  ('maintenance', 'L1_11', 'Concorde', '1', ST_SetSRID(ST_MakePoint(2.3213, 48.8656), 4326)::geography,
   'Bornes Navigo hors service sortie Tuileries, utilisez sortie Champs-Élysées',
   'e5f6a7b8-c9d0-1234-efab-567890123456', 'TechSupport', 4, 5200,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'd4e5f6a7-b8c9-0123-defa-456789012345']::UUID[],
   ARRAY[]::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[],
   'active', NOW() - INTERVAL '25 minutes', NOW() + INTERVAL '35 minutes'),

  ('maintenance', 'L1_18', 'Bastille', '1', ST_SetSRID(ST_MakePoint(2.3691, 48.8530), 4326)::geography,
   'Ascenseur en panne côté Place de la Bastille, escalators OK',
   '3ad1e2f3-b4c5-6789-defa-012345678901', 'InfoMetro', 2, 1520,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-567890123456', '07a8b9c0-e1f2-3456-abcd-789012345678']::UUID[],
   ARRAY[]::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890']::UUID[],
   'active', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '90 minutes'),

  ('maintenance', 'L6_4', 'Trocadéro', '6', ST_SetSRID(ST_MakePoint(2.2873, 48.8634), 4326)::geography,
   'Distributeur de tickets HS sortie Tour Eiffel',
   'f6a7b8c9-d0e1-2345-fabc-678901234567', 'SafeCommute', 2, 975,
   ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', 'd4e5f6a7-b8c9-0123-defa-456789012345']::UUID[],
   ARRAY[]::UUID[], ARRAY[]::UUID[],
   'active', NOW() - INTERVAL '18 minutes', NOW() + INTERVAL '42 minutes'),

  ('maintenance', 'L9_15', 'Franklin D. Roosevelt', '9', ST_SetSRID(ST_MakePoint(2.3099, 48.8689), 4326)::geography,
   'Escalator direction Mairie de Montreuil en panne',
   '07a8b9c0-e1f2-3456-abcd-789012345678', 'Commuter_Pro', 3, 2890,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-567890123456']::UUID[],
   ARRAY[]::UUID[], ARRAY[]::UUID[],
   'active', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '75 minutes');

-- Travaux
INSERT INTO reports (type, station_id, station_name, line, coordinates, comment, author_id, author_username, author_level, author_xp, votes_present, votes_absent, thanks, status, created_at, expires_at)
VALUES
  ('works', 'L14_12', 'Cour Saint-Émilion', '14', ST_SetSRID(ST_MakePoint(2.3859, 48.8338), 4326)::geography,
   'Sortie Est fermée pour travaux jusqu''à 20h, passez par sortie Ouest',
   '3ad1e2f3-b4c5-6789-defa-012345678901', 'InfoMetro', 2, 1520,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'e5f6a7b8-c9d0-1234-efab-567890123456', '07a8b9c0-e1f2-3456-abcd-789012345678', '29c0d1e2-a3b4-5678-cdef-901234567890']::UUID[],
   ARRAY[]::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', 'e5f6a7b8-c9d0-1234-efab-567890123456']::UUID[],
   'active', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '6 hours'),

  ('works', 'L13_12', 'Place de Clichy', '13', ST_SetSRID(ST_MakePoint(2.3276, 48.8833), 4326)::geography,
   'Travaux sur escalators, temps de parcours rallongé +3min',
   '07a8b9c0-e1f2-3456-abcd-789012345678', 'Commuter_Pro', 3, 2890,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-456789012345', '29c0d1e2-a3b4-5678-cdef-901234567890']::UUID[],
   ARRAY[]::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890']::UUID[],
   'active', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '5 hours'),

  ('works', 'L4_20', 'Montparnasse - Bienvenüe', '4', ST_SetSRID(ST_MakePoint(2.3215, 48.8420), 4326)::geography,
   'Couloir de correspondance ligne 6 fermé, faire le tour par ligne 12',
   'd4e5f6a7-b8c9-0123-defa-456789012345', 'Alert_75', 3, 3580,
   ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', 'e5f6a7b8-c9d0-1234-efab-567890123456', '18b9c0d1-f2a3-4567-bcde-890123456789']::UUID[],
   ARRAY[]::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[],
   'active', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '4 hours');

-- Quelques signalements expirés (historique)
INSERT INTO reports (type, station_id, station_name, line, coordinates, comment, author_id, author_username, author_level, author_xp, votes_present, votes_absent, thanks, status, created_at, expires_at)
VALUES
  ('controller', 'L4_13', 'Châtelet', '4', ST_SetSRID(ST_MakePoint(2.3474, 48.8583), 4326)::geography,
   'Contrôle terminé',
   'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Metro_Watcher', 4, 4120,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c3d4e5f6-a7b8-9012-cdef-345678901234']::UUID[],
   ARRAY['d4e5f6a7-b8c9-0123-defa-456789012345']::UUID[], ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890']::UUID[],
   'expired', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 minutes'),

  ('incident', 'L9_25', 'République', '9', ST_SetSRID(ST_MakePoint(2.3636, 48.8676), 4326)::geography,
   'Situation résolue, trafic normal',
   'd4e5f6a7-b8c9-0123-defa-456789012345', 'Alert_75', 3, 3580,
   ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', '07a8b9c0-e1f2-3456-abcd-789012345678']::UUID[],
   ARRAY[]::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', '07a8b9c0-e1f2-3456-abcd-789012345678']::UUID[],
   'expired', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '150 minutes'),

  ('controller', 'L1_13', 'Palais Royal - Musée du Louvre', '1', ST_SetSRID(ST_MakePoint(2.3364, 48.8618), 4326)::geography,
   'Équipe partie vers Châtelet',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Parisien_92', 3, 2450,
   ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012', 'e5f6a7b8-c9d0-1234-efab-567890123456']::UUID[],
   ARRAY['c3d4e5f6-a7b8-9012-cdef-345678901234']::UUID[], ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012']::UUID[],
   'expired', NOW() - INTERVAL '100 minutes', NOW() - INTERVAL '70 minutes');

-- Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Données insérées avec succès!' as status;
SELECT 'Users:' as table_name, COUNT(*) as count FROM users WHERE email LIKE '%@tube.app';
SELECT 'Reports actifs:' as table_name, COUNT(*) as count FROM reports WHERE status = 'active';
SELECT 'Reports expirés:' as table_name, COUNT(*) as count FROM reports WHERE status = 'expired';

-- Afficher un aperçu des signalements
SELECT
  type,
  station_name,
  line,
  author_username,
  array_length(votes_present, 1) as votes_present,
  array_length(thanks, 1) as thanks,
  EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutes_restantes,
  status
FROM reports
ORDER BY created_at DESC
LIMIT 10;
