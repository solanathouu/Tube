-- ============================================
-- SEED MOCK DATA - Tube App
-- Script pour insérer des données de test réalistes
-- ============================================

-- Note: Ce script suppose que les utilisateurs de test existent déjà dans auth.users
-- Pour un environnement de dev, vous pouvez créer les users via l'interface Supabase
-- ou désactiver temporairement les contraintes FK

-- ============================================
-- 1. UTILISATEURS DE TEST
-- ============================================
-- Ces UUIDs sont fixes pour pouvoir les référencer partout

DO $$
DECLARE
  user1_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  user2_id UUID := 'b2c3d4e5-f6a7-8901-bcde-f23456789012';
  user3_id UUID := 'c3d4e5f6-a7b8-9012-cdef-345678901234';
  user4_id UUID := 'd4e5f6a7-b8c9-0123-defa-456789012345';
  user5_id UUID := 'e5f6a7b8-c9d0-1234-efab-567890123456';
  user6_id UUID := 'f6a7b8c9-d0e1-2345-fabc-678901234567';
  user7_id UUID := '07a8b9c0-e1f2-3456-abcd-789012345678';
  user8_id UUID := '18b9c0d1-f2a3-4567-bcde-890123456789';
  user9_id UUID := '29c0d1e2-a3b4-5678-cdef-901234567890';
  user10_id UUID := '3ad1e2f3-b4c5-6789-defa-012345678901';
BEGIN
  -- Insérer les utilisateurs (ON CONFLICT pour éviter les doublons)
  INSERT INTO users (id, email, username, phone_number, xp, level, total_reports, total_votes, total_thanks_received, favorite_lines, badges, created_at)
  VALUES
    (user1_id, 'parisien92@tube.app', 'Parisien_92', '+33612345678', 2450, 3, 87, 234, 156, ARRAY['1', '14'], ARRAY['early_adopter', 'reporter_gold', 'voter_silver'], NOW() - INTERVAL '45 days'),
    (user2_id, 'metro.watcher@tube.app', 'Metro_Watcher', '+33623456789', 4120, 4, 156, 412, 298, ARRAY['1', '4', '7'], ARRAY['early_adopter', 'reporter_gold', 'voter_gold', 'streak_30'], NOW() - INTERVAL '60 days'),
    (user3_id, 'community.helper@tube.app', 'CommunityHelper', '+33634567890', 1890, 2, 42, 189, 87, ARRAY['14', '6'], ARRAY['reporter_silver'], NOW() - INTERVAL '30 days'),
    (user4_id, 'alert75@tube.app', 'Alert_75', '+33645678901', 3580, 3, 98, 356, 201, ARRAY['1', '2', '9'], ARRAY['reporter_gold', 'voter_silver', 'night_owl'], NOW() - INTERVAL '50 days'),
    (user5_id, 'techsupport@tube.app', 'TechSupport', '+33656789012', 5200, 4, 178, 489, 342, ARRAY['3', '11', '14'], ARRAY['reporter_gold', 'voter_gold', 'streak_60', 'top_contributor'], NOW() - INTERVAL '90 days'),
    (user6_id, 'safe.commute@tube.app', 'SafeCommute', '+33667890123', 975, 2, 28, 97, 45, ARRAY['6', '8'], ARRAY['reporter_bronze'], NOW() - INTERVAL '20 days'),
    (user7_id, 'commuter.pro@tube.app', 'Commuter_Pro', '+33678901234', 2890, 3, 76, 287, 167, ARRAY['4', '12', '13'], ARRAY['reporter_silver', 'voter_silver'], NOW() - INTERVAL '40 days'),
    (user8_id, 'realtime.alert@tube.app', 'RealTimeAlert', '+33689012345', 3100, 3, 89, 312, 189, ARRAY['1', '7', '14'], ARRAY['reporter_gold', 'speed_demon'], NOW() - INTERVAL '35 days'),
    (user9_id, 'city.guardian@tube.app', 'CityGuardian', '+33690123456', 4450, 4, 134, 445, 278, ARRAY['2', '5', '9'], ARRAY['reporter_gold', 'voter_gold', 'guardian'], NOW() - INTERVAL '75 days'),
    (user10_id, 'info.metro@tube.app', 'InfoMetro', '+33601234567', 1520, 2, 38, 152, 72, ARRAY['8', '10'], ARRAY['reporter_silver'], NOW() - INTERVAL '25 days')
  ON CONFLICT (id) DO UPDATE SET
    xp = EXCLUDED.xp,
    level = EXCLUDED.level,
    total_reports = EXCLUDED.total_reports,
    total_votes = EXCLUDED.total_votes,
    total_thanks_received = EXCLUDED.total_thanks_received,
    updated_at = NOW();
END $$;

-- ============================================
-- 2. SIGNALEMENTS (REPORTS)
-- ============================================

DO $$
DECLARE
  user1_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  user2_id UUID := 'b2c3d4e5-f6a7-8901-bcde-f23456789012';
  user3_id UUID := 'c3d4e5f6-a7b8-9012-cdef-345678901234';
  user4_id UUID := 'd4e5f6a7-b8c9-0123-defa-456789012345';
  user5_id UUID := 'e5f6a7b8-c9d0-1234-efab-567890123456';
  user6_id UUID := 'f6a7b8c9-d0e1-2345-fabc-678901234567';
  user7_id UUID := '07a8b9c0-e1f2-3456-abcd-789012345678';
  user8_id UUID := '18b9c0d1-f2a3-4567-bcde-890123456789';
  user9_id UUID := '29c0d1e2-a3b4-5678-cdef-901234567890';
  user10_id UUID := '3ad1e2f3-b4c5-6789-defa-012345678901';
BEGIN
  -- Supprimer les anciens reports de test
  DELETE FROM reports WHERE author_id IN (user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user7_id, user8_id, user9_id, user10_id);

  -- Signalements actifs (créés récemment)
  INSERT INTO reports (type, station_id, station_name, line, coordinates, comment, author_id, author_username, author_level, author_xp, votes_present, votes_absent, thanks, status, created_at, expires_at)
  VALUES
    -- Contrôleurs
    ('controller', 'L1_15', 'Châtelet', '1', ST_SetSRID(ST_MakePoint(2.3474, 48.8583), 4326)::geography, 'Équipe de 4 personnes à la sortie principale côté Les Halles', user1_id, 'Parisien_92', 3, 2450, ARRAY[user2_id, user3_id, user4_id, user5_id, user6_id, user7_id, user8_id]::UUID[], ARRAY[user9_id]::UUID[], ARRAY[user2_id, user4_id, user5_id]::UUID[], 'active', NOW() - INTERVAL '8 minutes', NOW() + INTERVAL '22 minutes'),

    ('controller', 'L1_19', 'Gare de Lyon', '1', ST_SetSRID(ST_MakePoint(2.3736, 48.8442), 4326)::geography, 'Contrôle en cours côté RER A, équipe mobile', user2_id, 'Metro_Watcher', 4, 4120, ARRAY[user1_id, user3_id, user5_id, user6_id, user7_id, user8_id, user9_id, user10_id]::UUID[], ARRAY[]::UUID[], ARRAY[user1_id, user3_id, user5_id, user7_id]::UUID[], 'active', NOW() - INTERVAL '12 minutes', NOW() + INTERVAL '18 minutes'),

    ('controller', 'L14_9', 'Châtelet', '14', ST_SetSRID(ST_MakePoint(2.3474, 48.8583), 4326)::geography, 'Grande équipe ligne 14, contrôle systématique', user8_id, 'RealTimeAlert', 3, 3100, ARRAY[user1_id, user2_id, user4_id, user5_id]::UUID[], ARRAY[]::UUID[], ARRAY[user2_id]::UUID[], 'active', NOW() - INTERVAL '3 minutes', NOW() + INTERVAL '27 minutes'),

    ('controller', 'L4_6', 'Gare du Nord', '4', ST_SetSRID(ST_MakePoint(2.3553, 48.8809), 4326)::geography, 'Équipe de 3 à la correspondance RER', user4_id, 'Alert_75', 3, 3580, ARRAY[user2_id, user3_id, user7_id, user9_id, user10_id]::UUID[], ARRAY[user1_id]::UUID[], ARRAY[user2_id, user7_id]::UUID[], 'active', NOW() - INTERVAL '6 minutes', NOW() + INTERVAL '24 minutes'),

    ('controller', 'L1_7', 'Charles de Gaulle - Étoile', '1', ST_SetSRID(ST_MakePoint(2.2950, 48.8738), 4326)::geography, 'Patrouille mobile entre correspondances', user9_id, 'CityGuardian', 4, 4450, ARRAY[user1_id, user2_id, user3_id, user4_id, user5_id]::UUID[], ARRAY[]::UUID[], ARRAY[user1_id, user4_id]::UUID[], 'active', NOW() - INTERVAL '4 minutes', NOW() + INTERVAL '26 minutes'),

    -- Incidents
    ('incident', 'L14_10', 'Gare de Lyon', '14', ST_SetSRID(ST_MakePoint(2.3736, 48.8442), 4326)::geography, 'Retard important, affluence sur les quais, prévoyez 10min de plus', user3_id, 'CommunityHelper', 2, 1890, ARRAY[user1_id, user2_id, user4_id, user5_id, user6_id, user7_id, user8_id, user9_id, user10_id]::UUID[], ARRAY[]::UUID[], ARRAY[user1_id, user2_id, user4_id, user5_id, user8_id]::UUID[], 'active', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '15 minutes'),

    ('incident', 'L7_8', 'Stalingrad', '7', ST_SetSRID(ST_MakePoint(2.3673, 48.8838), 4326)::geography, 'Colis suspect signalé, évacuation partielle du quai direction Villejuif', user7_id, 'Commuter_Pro', 3, 2890, ARRAY[user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user8_id, user9_id]::UUID[], ARRAY[]::UUID[], ARRAY[user1_id, user2_id, user3_id, user4_id, user5_id]::UUID[], 'active', NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '20 minutes'),

    ('incident', 'L1_9', 'Franklin D. Roosevelt', '1', ST_SetSRID(ST_MakePoint(2.3099, 48.8689), 4326)::geography, 'Trains irréguliers, attente prolongée', user5_id, 'TechSupport', 4, 5200, ARRAY[user1_id, user3_id, user4_id, user6_id, user7_id]::UUID[], ARRAY[user2_id]::UUID[], ARRAY[user1_id, user4_id]::UUID[], 'active', NOW() - INTERVAL '7 minutes', NOW() + INTERVAL '23 minutes'),

    -- Maintenance
    ('maintenance', 'L1_11', 'Concorde', '1', ST_SetSRID(ST_MakePoint(2.3213, 48.8656), 4326)::geography, 'Bornes Navigo hors service sortie Tuileries, utilisez sortie Champs-Élysées', user5_id, 'TechSupport', 4, 5200, ARRAY[user1_id, user2_id, user3_id, user4_id, user6_id, user7_id, user8_id]::UUID[], ARRAY[]::UUID[], ARRAY[user1_id, user2_id, user3_id]::UUID[], 'active', NOW() - INTERVAL '25 minutes', NOW() + INTERVAL '5 minutes'),

    ('maintenance', 'L1_18', 'Bastille', '1', ST_SetSRID(ST_MakePoint(2.3691, 48.8530), 4326)::geography, 'Ascenseur en panne, escalators OK', user10_id, 'InfoMetro', 2, 1520, ARRAY[user1_id, user3_id, user5_id, user7_id, user9_id]::UUID[], ARRAY[]::UUID[], ARRAY[user1_id]::UUID[], 'active', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes'),

    ('maintenance', 'L6_4', 'Trocadéro', '6', ST_SetSRID(ST_MakePoint(2.2873, 48.8634), 4326)::geography, 'Distributeur de tickets HS sortie Tour Eiffel', user6_id, 'SafeCommute', 2, 975, ARRAY[user2_id, user4_id, user8_id]::UUID[], ARRAY[]::UUID[], ARRAY[]::UUID[], 'active', NOW() - INTERVAL '18 minutes', NOW() + INTERVAL '12 minutes'),

    -- Travaux
    ('works', 'L14_12', 'Cour Saint-Émilion', '14', ST_SetSRID(ST_MakePoint(2.3859, 48.8338), 4326)::geography, 'Sortie Est fermée pour travaux jusqu''à 20h', user10_id, 'InfoMetro', 2, 1520, ARRAY[user1_id, user2_id, user3_id, user5_id, user7_id, user8_id, user9_id]::UUID[], ARRAY[]::UUID[], ARRAY[user2_id, user5_id]::UUID[], 'active', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '4 hours'),

    ('works', 'L13_12', 'Place de Clichy', '13', ST_SetSRID(ST_MakePoint(2.3276, 48.8833), 4326)::geography, 'Travaux sur escalators, accès limité', user7_id, 'Commuter_Pro', 3, 2890, ARRAY[user1_id, user4_id, user6_id, user9_id]::UUID[], ARRAY[]::UUID[], ARRAY[user1_id]::UUID[], 'active', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '3 hours');

  -- Signalements expirés (pour l'historique)
  INSERT INTO reports (type, station_id, station_name, line, coordinates, comment, author_id, author_username, author_level, author_xp, votes_present, votes_absent, thanks, status, created_at, expires_at)
  VALUES
    ('controller', 'L4_13', 'Châtelet', '4', ST_SetSRID(ST_MakePoint(2.3474, 48.8583), 4326)::geography, 'Contrôle terminé', user2_id, 'Metro_Watcher', 4, 4120, ARRAY[user1_id, user3_id, user5_id]::UUID[], ARRAY[user4_id, user6_id]::UUID[], ARRAY[user1_id]::UUID[], 'expired', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes'),

    ('incident', 'L9_25', 'République', '9', ST_SetSRID(ST_MakePoint(2.3636, 48.8676), 4326)::geography, 'Situation résolue', user4_id, 'Alert_75', 3, 3580, ARRAY[user1_id, user2_id, user7_id, user8_id]::UUID[], ARRAY[]::UUID[], ARRAY[user2_id, user7_id]::UUID[], 'expired', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes'),

    ('controller', 'L1_13', 'Palais Royal - Musée du Louvre', '1', ST_SetSRID(ST_MakePoint(2.3364, 48.8618), 4326)::geography, 'Équipe partie', user1_id, 'Parisien_92', 3, 2450, ARRAY[user2_id, user5_id, user9_id]::UUID[], ARRAY[user3_id]::UUID[], ARRAY[user2_id]::UUID[], 'expired', NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour');
END $$;

-- ============================================
-- 3. RELATIONS D'AMITIÉ
-- ============================================

DO $$
DECLARE
  user1_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  user2_id UUID := 'b2c3d4e5-f6a7-8901-bcde-f23456789012';
  user3_id UUID := 'c3d4e5f6-a7b8-9012-cdef-345678901234';
  user4_id UUID := 'd4e5f6a7-b8c9-0123-defa-456789012345';
  user5_id UUID := 'e5f6a7b8-c9d0-1234-efab-567890123456';
  user6_id UUID := 'f6a7b8c9-d0e1-2345-fabc-678901234567';
  user7_id UUID := '07a8b9c0-e1f2-3456-abcd-789012345678';
  user8_id UUID := '18b9c0d1-f2a3-4567-bcde-890123456789';
BEGIN
  -- Nettoyer les anciennes données
  DELETE FROM friendships WHERE user_id IN (user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user7_id, user8_id);
  DELETE FROM friend_requests WHERE sender_id IN (user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user7_id, user8_id);
  DELETE FROM share_permissions WHERE user_id IN (user1_id, user2_id, user3_id, user4_id, user5_id, user6_id, user7_id, user8_id);

  -- Amitiés établies (bidirectionnelles)
  -- User1 <-> User2
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user1_id, user2_id, 'active'), (user2_id, user1_id, 'active') ON CONFLICT DO NOTHING;
  -- User1 <-> User4
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user1_id, user4_id, 'active'), (user4_id, user1_id, 'active') ON CONFLICT DO NOTHING;
  -- User1 <-> User5
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user1_id, user5_id, 'active'), (user5_id, user1_id, 'active') ON CONFLICT DO NOTHING;
  -- User2 <-> User3
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user2_id, user3_id, 'active'), (user3_id, user2_id, 'active') ON CONFLICT DO NOTHING;
  -- User2 <-> User5
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user2_id, user5_id, 'active'), (user5_id, user2_id, 'active') ON CONFLICT DO NOTHING;
  -- User3 <-> User7
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user3_id, user7_id, 'active'), (user7_id, user3_id, 'active') ON CONFLICT DO NOTHING;
  -- User4 <-> User8
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user4_id, user8_id, 'active'), (user8_id, user4_id, 'active') ON CONFLICT DO NOTHING;
  -- User5 <-> User6
  INSERT INTO friendships (user_id, friend_id, status) VALUES (user5_id, user6_id, 'active'), (user6_id, user5_id, 'active') ON CONFLICT DO NOTHING;

  -- Permissions de partage
  INSERT INTO share_permissions (user_id, friend_id, can_see_location, can_see_trips, always_share, notify_on_trip_start) VALUES
    (user1_id, user2_id, true, true, false, true),
    (user2_id, user1_id, true, true, false, true),
    (user1_id, user4_id, true, true, true, false),
    (user4_id, user1_id, true, false, false, false),
    (user1_id, user5_id, false, true, false, false),
    (user5_id, user1_id, true, true, false, true),
    (user2_id, user3_id, true, true, false, false),
    (user3_id, user2_id, true, true, false, false),
    (user2_id, user5_id, true, true, true, true),
    (user5_id, user2_id, true, true, true, true)
  ON CONFLICT DO NOTHING;

  -- Demandes d'amitié en attente
  INSERT INTO friend_requests (sender_id, recipient_id, status, message) VALUES
    (user6_id, user1_id, 'pending', 'Salut ! On se croise souvent sur la ligne 1, on s''ajoute ?'),
    (user7_id, user2_id, 'pending', 'Hey Metro_Watcher, tes signalements sont toujours précis !'),
    (user8_id, user3_id, 'pending', NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 4. TRAJETS ACTIFS
-- ============================================

DO $$
DECLARE
  user1_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  user2_id UUID := 'b2c3d4e5-f6a7-8901-bcde-f23456789012';
  user4_id UUID := 'd4e5f6a7-b8c9-0123-defa-456789012345';
  trip1_id UUID;
  trip2_id UUID;
BEGIN
  -- Nettoyer les trajets de test
  DELETE FROM trip_positions WHERE trip_id IN (SELECT id FROM active_trips WHERE user_id IN (user1_id, user2_id, user4_id));
  DELETE FROM active_trips WHERE user_id IN (user1_id, user2_id, user4_id);

  -- Trajet 1: User2 va à Gare de Lyon
  INSERT INTO active_trips (user_id, trip_type, status, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, estimated_duration_seconds, share_token, shared_with_friend_ids, started_at)
  VALUES (
    user2_id, 'navigation', 'active',
    'Châtelet', 48.8583, 2.3474,
    'Gare de Lyon', 48.8442, 2.3736,
    720, -- 12 minutes
    'share_' || encode(gen_random_bytes(8), 'hex'),
    ARRAY[user1_id]::UUID[],
    NOW() - INTERVAL '5 minutes'
  ) RETURNING id INTO trip1_id;

  -- Positions pour trajet 1 (simulation de mouvement)
  INSERT INTO trip_positions (trip_id, latitude, longitude, accuracy, heading, speed, timestamp) VALUES
    (trip1_id, 48.8583, 2.3474, 10.5, 135, 0, NOW() - INTERVAL '5 minutes'),
    (trip1_id, 48.8575, 2.3521, 8.2, 120, 8.5, NOW() - INTERVAL '4 minutes'),
    (trip1_id, 48.8554, 2.3608, 9.1, 115, 12.3, NOW() - INTERVAL '3 minutes'),
    (trip1_id, 48.8530, 2.3691, 7.8, 130, 11.8, NOW() - INTERVAL '2 minutes'),
    (trip1_id, 48.8490, 2.3710, 8.5, 145, 10.2, NOW() - INTERVAL '1 minute'),
    (trip1_id, 48.8465, 2.3725, 9.3, 150, 9.5, NOW() - INTERVAL '30 seconds');

  -- Trajet 2: User4 en mode urgence vers La Défense
  INSERT INTO active_trips (user_id, trip_type, status, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, estimated_duration_seconds, share_token, shared_with_friend_ids, auto_shared, started_at)
  VALUES (
    user4_id, 'emergency', 'active',
    'République', 48.8676, 2.3636,
    'La Défense', 48.8919, 2.2380,
    1500, -- 25 minutes
    'emerg_' || encode(gen_random_bytes(8), 'hex'),
    ARRAY[user1_id, user2_id]::UUID[],
    true,
    NOW() - INTERVAL '8 minutes'
  ) RETURNING id INTO trip2_id;

  -- Positions pour trajet 2
  INSERT INTO trip_positions (trip_id, latitude, longitude, accuracy, heading, speed, timestamp) VALUES
    (trip2_id, 48.8676, 2.3636, 12.0, 270, 0, NOW() - INTERVAL '8 minutes'),
    (trip2_id, 48.8693, 2.3544, 10.5, 280, 10.5, NOW() - INTERVAL '6 minutes'),
    (trip2_id, 48.8708, 2.3314, 9.8, 285, 15.2, NOW() - INTERVAL '4 minutes'),
    (trip2_id, 48.8733, 2.3153, 8.2, 290, 14.8, NOW() - INTERVAL '2 minutes'),
    (trip2_id, 48.8760, 2.3050, 7.5, 295, 13.5, NOW() - INTERVAL '1 minute');
END $$;

-- ============================================
-- 5. LIVE SHARES (ancienne table)
-- ============================================

DO $$
DECLARE
  user3_id UUID := 'c3d4e5f6-a7b8-9012-cdef-345678901234';
  share_id UUID;
BEGIN
  -- Nettoyer
  DELETE FROM live_share_positions WHERE share_id IN (SELECT id FROM live_shares WHERE user_id = user3_id);
  DELETE FROM live_shares WHERE user_id = user3_id;

  -- Un partage en cours
  INSERT INTO live_shares (user_id, share_token, status, destination_name, destination_lat, destination_lng, eta_seconds, started_at)
  VALUES (
    user3_id,
    'live_' || encode(gen_random_bytes(8), 'hex'),
    'active',
    'Bibliothèque François Mitterrand',
    48.8299, 2.3760,
    600,
    NOW() - INTERVAL '10 minutes'
  ) RETURNING id INTO share_id;

  INSERT INTO live_share_positions (share_id, latitude, longitude, accuracy, heading, speed, timestamp) VALUES
    (share_id, 48.8313, 2.3551, 11.0, 180, 0, NOW() - INTERVAL '10 minutes'),
    (share_id, 48.8305, 2.3620, 9.5, 175, 8.2, NOW() - INTERVAL '7 minutes'),
    (share_id, 48.8300, 2.3700, 8.8, 170, 7.5, NOW() - INTERVAL '4 minutes'),
    (share_id, 48.8299, 2.3745, 10.2, 165, 5.0, NOW() - INTERVAL '1 minute');
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Users créés:' as info, COUNT(*) as count FROM users WHERE email LIKE '%@tube.app';
SELECT 'Reports actifs:' as info, COUNT(*) as count FROM reports WHERE status = 'active';
SELECT 'Reports expirés:' as info, COUNT(*) as count FROM reports WHERE status = 'expired';
SELECT 'Friendships:' as info, COUNT(*) as count FROM friendships;
SELECT 'Friend requests pending:' as info, COUNT(*) as count FROM friend_requests WHERE status = 'pending';
SELECT 'Active trips:' as info, COUNT(*) as count FROM active_trips WHERE status = 'active';
SELECT 'Live shares actifs:' as info, COUNT(*) as count FROM live_shares WHERE status = 'active';
