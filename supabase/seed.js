/**
 * Script pour insérer des données mockées dans Supabase
 *
 * Exécuter avec: node supabase/seed.js
 *
 * Nécessite: npm install @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY requises dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UUIDs fixes pour les utilisateurs de test
const userIds = {
  user1: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  user2: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  user3: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
  user4: 'd4e5f6a7-b8c9-0123-defa-456789012345',
  user5: 'e5f6a7b8-c9d0-1234-efab-567890123456',
  user6: 'f6a7b8c9-d0e1-2345-fabc-678901234567',
  user7: '07a8b9c0-e1f2-3456-abcd-789012345678',
  user8: '18b9c0d1-f2a3-4567-bcde-890123456789',
  user9: '29c0d1e2-a3b4-5678-cdef-901234567890',
  user10: '3ad1e2f3-b4c5-6789-defa-012345678901',
};

// Données des utilisateurs
const users = [
  { id: userIds.user1, email: 'parisien92@tube.app', username: 'Parisien_92', phone_number: '+33612345678', xp: 2450, level: 3, total_reports: 87, total_votes: 234, total_thanks_received: 156, favorite_lines: ['1', '14'], badges: ['early_adopter', 'reporter_gold'] },
  { id: userIds.user2, email: 'metro.watcher@tube.app', username: 'Metro_Watcher', phone_number: '+33623456789', xp: 4120, level: 4, total_reports: 156, total_votes: 412, total_thanks_received: 298, favorite_lines: ['1', '4', '7'], badges: ['early_adopter', 'reporter_gold', 'voter_gold'] },
  { id: userIds.user3, email: 'community.helper@tube.app', username: 'CommunityHelper', phone_number: '+33634567890', xp: 1890, level: 2, total_reports: 42, total_votes: 189, total_thanks_received: 87, favorite_lines: ['14', '6'], badges: ['reporter_silver'] },
  { id: userIds.user4, email: 'alert75@tube.app', username: 'Alert_75', phone_number: '+33645678901', xp: 3580, level: 3, total_reports: 98, total_votes: 356, total_thanks_received: 201, favorite_lines: ['1', '2', '9'], badges: ['reporter_gold', 'voter_silver'] },
  { id: userIds.user5, email: 'techsupport@tube.app', username: 'TechSupport', phone_number: '+33656789012', xp: 5200, level: 4, total_reports: 178, total_votes: 489, total_thanks_received: 342, favorite_lines: ['3', '11', '14'], badges: ['reporter_gold', 'voter_gold', 'top_contributor'] },
  { id: userIds.user6, email: 'safe.commute@tube.app', username: 'SafeCommute', phone_number: '+33667890123', xp: 975, level: 2, total_reports: 28, total_votes: 97, total_thanks_received: 45, favorite_lines: ['6', '8'], badges: ['reporter_bronze'] },
  { id: userIds.user7, email: 'commuter.pro@tube.app', username: 'Commuter_Pro', phone_number: '+33678901234', xp: 2890, level: 3, total_reports: 76, total_votes: 287, total_thanks_received: 167, favorite_lines: ['4', '12', '13'], badges: ['reporter_silver', 'voter_silver'] },
  { id: userIds.user8, email: 'realtime.alert@tube.app', username: 'RealTimeAlert', phone_number: '+33689012345', xp: 3100, level: 3, total_reports: 89, total_votes: 312, total_thanks_received: 189, favorite_lines: ['1', '7', '14'], badges: ['reporter_gold', 'speed_demon'] },
  { id: userIds.user9, email: 'city.guardian@tube.app', username: 'CityGuardian', phone_number: '+33690123456', xp: 4450, level: 4, total_reports: 134, total_votes: 445, total_thanks_received: 278, favorite_lines: ['2', '5', '9'], badges: ['reporter_gold', 'voter_gold'] },
  { id: userIds.user10, email: 'info.metro@tube.app', username: 'InfoMetro', phone_number: '+33601234567', xp: 1520, level: 2, total_reports: 38, total_votes: 152, total_thanks_received: 72, favorite_lines: ['8', '10'], badges: ['reporter_silver'] },
];

// Helper pour créer un timestamp relatif
const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60 * 1000).toISOString();
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

// Signalements
const reports = [
  // Contrôleurs
  {
    type: 'controller',
    station_id: 'L1_15',
    station_name: 'Châtelet',
    line: '1',
    coordinates: { type: 'Point', coordinates: [2.3474, 48.8583] },
    comment: 'Équipe de 4 personnes à la sortie principale côté Les Halles',
    author_id: userIds.user1,
    author_username: 'Parisien_92',
    author_level: 3,
    author_xp: 2450,
    votes_present: [userIds.user2, userIds.user3, userIds.user4, userIds.user5],
    votes_absent: [],
    thanks: [userIds.user2, userIds.user4],
    status: 'active',
    created_at: minutesAgo(5),
    expires_at: minutesFromNow(25),
  },
  {
    type: 'controller',
    station_id: 'L1_19',
    station_name: 'Gare de Lyon',
    line: '1',
    coordinates: { type: 'Point', coordinates: [2.3736, 48.8442] },
    comment: 'Contrôle en cours côté RER A, équipe mobile',
    author_id: userIds.user2,
    author_username: 'Metro_Watcher',
    author_level: 4,
    author_xp: 4120,
    votes_present: [userIds.user1, userIds.user3, userIds.user5, userIds.user6, userIds.user7],
    votes_absent: [],
    thanks: [userIds.user1, userIds.user5, userIds.user7],
    status: 'active',
    created_at: minutesAgo(12),
    expires_at: minutesFromNow(18),
  },
  {
    type: 'controller',
    station_id: 'L14_9',
    station_name: 'Châtelet',
    line: '14',
    coordinates: { type: 'Point', coordinates: [2.3474, 48.8583] },
    comment: 'Grande équipe ligne 14, contrôle systématique à la descente',
    author_id: userIds.user8,
    author_username: 'RealTimeAlert',
    author_level: 3,
    author_xp: 3100,
    votes_present: [userIds.user1, userIds.user2, userIds.user4],
    votes_absent: [],
    thanks: [userIds.user2],
    status: 'active',
    created_at: minutesAgo(3),
    expires_at: minutesFromNow(27),
  },
  {
    type: 'controller',
    station_id: 'L4_6',
    station_name: 'Gare du Nord',
    line: '4',
    coordinates: { type: 'Point', coordinates: [2.3553, 48.8809] },
    comment: 'Équipe de 3 à la correspondance RER B/D',
    author_id: userIds.user4,
    author_username: 'Alert_75',
    author_level: 3,
    author_xp: 3580,
    votes_present: [userIds.user2, userIds.user7, userIds.user9],
    votes_absent: [userIds.user1],
    thanks: [userIds.user2],
    status: 'active',
    created_at: minutesAgo(6),
    expires_at: minutesFromNow(24),
  },
  {
    type: 'controller',
    station_id: 'L1_7',
    station_name: 'Charles de Gaulle - Étoile',
    line: '1',
    coordinates: { type: 'Point', coordinates: [2.2950, 48.8738] },
    comment: 'Patrouille mobile entre correspondances lignes 1/2/6',
    author_id: userIds.user9,
    author_username: 'CityGuardian',
    author_level: 4,
    author_xp: 4450,
    votes_present: [userIds.user1, userIds.user2, userIds.user4, userIds.user5],
    votes_absent: [],
    thanks: [userIds.user1, userIds.user4],
    status: 'active',
    created_at: minutesAgo(4),
    expires_at: minutesFromNow(26),
  },
  {
    type: 'controller',
    station_id: 'L7_17',
    station_name: 'Pyramides',
    line: '7',
    coordinates: { type: 'Point', coordinates: [2.3333, 48.8662] },
    comment: 'Équipe de 2, contrôle à la montée direction La Courneuve',
    author_id: userIds.user5,
    author_username: 'TechSupport',
    author_level: 4,
    author_xp: 5200,
    votes_present: [userIds.user1, userIds.user7],
    votes_absent: [],
    thanks: [],
    status: 'active',
    created_at: minutesAgo(9),
    expires_at: minutesFromNow(21),
  },
  // Incidents
  {
    type: 'incident',
    station_id: 'L14_10',
    station_name: 'Gare de Lyon',
    line: '14',
    coordinates: { type: 'Point', coordinates: [2.3736, 48.8442] },
    comment: 'Retard important (~10min), affluence sur les quais direction Olympiades',
    author_id: userIds.user3,
    author_username: 'CommunityHelper',
    author_level: 2,
    author_xp: 1890,
    votes_present: [userIds.user1, userIds.user2, userIds.user4, userIds.user5, userIds.user7, userIds.user8],
    votes_absent: [],
    thanks: [userIds.user1, userIds.user2, userIds.user5],
    status: 'active',
    created_at: minutesAgo(15),
    expires_at: minutesFromNow(15),
  },
  {
    type: 'incident',
    station_id: 'L7_8',
    station_name: 'Stalingrad',
    line: '7',
    coordinates: { type: 'Point', coordinates: [2.3673, 48.8838] },
    comment: 'Colis suspect signalé, évacuation partielle quai direction Villejuif',
    author_id: userIds.user7,
    author_username: 'Commuter_Pro',
    author_level: 3,
    author_xp: 2890,
    votes_present: [userIds.user1, userIds.user2, userIds.user3, userIds.user4, userIds.user9],
    votes_absent: [],
    thanks: [userIds.user1, userIds.user2, userIds.user4],
    status: 'active',
    created_at: minutesAgo(10),
    expires_at: minutesFromNow(20),
  },
  {
    type: 'incident',
    station_id: 'L1_9',
    station_name: 'Franklin D. Roosevelt',
    line: '1',
    coordinates: { type: 'Point', coordinates: [2.3099, 48.8689] },
    comment: 'Trains irréguliers suite à un malaise voyageur, attente prolongée',
    author_id: userIds.user5,
    author_username: 'TechSupport',
    author_level: 4,
    author_xp: 5200,
    votes_present: [userIds.user1, userIds.user3, userIds.user7],
    votes_absent: [userIds.user2],
    thanks: [userIds.user1],
    status: 'active',
    created_at: minutesAgo(7),
    expires_at: minutesFromNow(23),
  },
  // Maintenance
  {
    type: 'maintenance',
    station_id: 'L1_11',
    station_name: 'Concorde',
    line: '1',
    coordinates: { type: 'Point', coordinates: [2.3213, 48.8656] },
    comment: 'Bornes Navigo hors service sortie Tuileries, utilisez sortie Champs-Élysées',
    author_id: userIds.user5,
    author_username: 'TechSupport',
    author_level: 4,
    author_xp: 5200,
    votes_present: [userIds.user1, userIds.user2, userIds.user3, userIds.user4],
    votes_absent: [],
    thanks: [userIds.user1, userIds.user2],
    status: 'active',
    created_at: minutesAgo(25),
    expires_at: minutesFromNow(35),
  },
  {
    type: 'maintenance',
    station_id: 'L1_18',
    station_name: 'Bastille',
    line: '1',
    coordinates: { type: 'Point', coordinates: [2.3691, 48.8530] },
    comment: 'Ascenseur en panne côté Place de la Bastille, escalators OK',
    author_id: userIds.user10,
    author_username: 'InfoMetro',
    author_level: 2,
    author_xp: 1520,
    votes_present: [userIds.user1, userIds.user5, userIds.user7],
    votes_absent: [],
    thanks: [userIds.user1],
    status: 'active',
    created_at: minutesAgo(30),
    expires_at: minutesFromNow(90),
  },
  {
    type: 'maintenance',
    station_id: 'L6_4',
    station_name: 'Trocadéro',
    line: '6',
    coordinates: { type: 'Point', coordinates: [2.2873, 48.8634] },
    comment: 'Distributeur de tickets HS sortie Tour Eiffel',
    author_id: userIds.user6,
    author_username: 'SafeCommute',
    author_level: 2,
    author_xp: 975,
    votes_present: [userIds.user2, userIds.user4],
    votes_absent: [],
    thanks: [],
    status: 'active',
    created_at: minutesAgo(18),
    expires_at: minutesFromNow(42),
  },
  // Travaux
  {
    type: 'works',
    station_id: 'L14_12',
    station_name: 'Cour Saint-Émilion',
    line: '14',
    coordinates: { type: 'Point', coordinates: [2.3859, 48.8338] },
    comment: "Sortie Est fermée pour travaux jusqu'à 20h, passez par sortie Ouest",
    author_id: userIds.user10,
    author_username: 'InfoMetro',
    author_level: 2,
    author_xp: 1520,
    votes_present: [userIds.user1, userIds.user2, userIds.user5, userIds.user7, userIds.user9],
    votes_absent: [],
    thanks: [userIds.user2, userIds.user5],
    status: 'active',
    created_at: hoursAgo(2),
    expires_at: hoursFromNow(6),
  },
  {
    type: 'works',
    station_id: 'L13_12',
    station_name: 'Place de Clichy',
    line: '13',
    coordinates: { type: 'Point', coordinates: [2.3276, 48.8833] },
    comment: 'Travaux sur escalators, temps de parcours rallongé +3min',
    author_id: userIds.user7,
    author_username: 'Commuter_Pro',
    author_level: 3,
    author_xp: 2890,
    votes_present: [userIds.user1, userIds.user4, userIds.user9],
    votes_absent: [],
    thanks: [userIds.user1],
    status: 'active',
    created_at: hoursAgo(3),
    expires_at: hoursFromNow(5),
  },
  // Expirés (historique)
  {
    type: 'controller',
    station_id: 'L4_13',
    station_name: 'Châtelet',
    line: '4',
    coordinates: { type: 'Point', coordinates: [2.3474, 48.8583] },
    comment: 'Contrôle terminé',
    author_id: userIds.user2,
    author_username: 'Metro_Watcher',
    author_level: 4,
    author_xp: 4120,
    votes_present: [userIds.user1, userIds.user3],
    votes_absent: [userIds.user4],
    thanks: [userIds.user1],
    status: 'expired',
    created_at: hoursAgo(2),
    expires_at: hoursAgo(1.5),
  },
  {
    type: 'incident',
    station_id: 'L9_25',
    station_name: 'République',
    line: '9',
    coordinates: { type: 'Point', coordinates: [2.3636, 48.8676] },
    comment: 'Situation résolue, trafic normal',
    author_id: userIds.user4,
    author_username: 'Alert_75',
    author_level: 3,
    author_xp: 3580,
    votes_present: [userIds.user1, userIds.user2, userIds.user7],
    votes_absent: [],
    thanks: [userIds.user2, userIds.user7],
    status: 'expired',
    created_at: hoursAgo(3),
    expires_at: hoursAgo(2.5),
  },
];

async function seed() {
  console.log('🚀 Démarrage du seed des données...\n');

  // 1. Insérer les utilisateurs
  console.log('👥 Insertion des utilisateurs...');
  for (const user of users) {
    const { error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Erreur pour ${user.username}:`, error.message);
    } else {
      console.log(`  ✅ ${user.username} (Level ${user.level}, ${user.xp} XP)`);
    }
  }

  // 2. Insérer les signalements
  console.log('\n📍 Insertion des signalements...');

  // Transformer les coordonnées en format PostGIS
  const reportsWithGeo = reports.map(report => ({
    ...report,
    coordinates: `POINT(${report.coordinates.coordinates[0]} ${report.coordinates.coordinates[1]})`,
  }));

  for (const report of reportsWithGeo) {
    const { error } = await supabase
      .from('reports')
      .insert(report);

    if (error) {
      console.error(`  ❌ Erreur pour ${report.station_name} (${report.type}):`, error.message);
    } else {
      console.log(`  ✅ ${report.type} @ ${report.station_name} (L${report.line}) - ${report.status}`);
    }
  }

  // 3. Vérification
  console.log('\n📊 Vérification...');

  const { data: usersCount } = await supabase
    .from('users')
    .select('id', { count: 'exact' });
  console.log(`  Users: ${usersCount?.length || 0}`);

  const { data: activeReports } = await supabase
    .from('reports')
    .select('id', { count: 'exact' })
    .eq('status', 'active');
  console.log(`  Reports actifs: ${activeReports?.length || 0}`);

  const { data: expiredReports } = await supabase
    .from('reports')
    .select('id', { count: 'exact' })
    .eq('status', 'expired');
  console.log(`  Reports expirés: ${expiredReports?.length || 0}`);

  console.log('\n✨ Seed terminé!');
}

// Exécuter
seed().catch(console.error);
