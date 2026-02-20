/**
 * Script pour supprimer les signalements mockés de Supabase
 * Exécuter avec: node supabase/delete_mock_reports.js
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

// UUIDs des utilisateurs mockés
const mockUserIds = [
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'd4e5f6a7-b8c9-0123-defa-456789012345',
  'e5f6a7b8-c9d0-1234-efab-567890123456',
  'f6a7b8c9-d0e1-2345-fabc-678901234567',
  '07a8b9c0-e1f2-3456-abcd-789012345678',
  '18b9c0d1-f2a3-4567-bcde-890123456789',
  '29c0d1e2-a3b4-5678-cdef-901234567890',
  '3ad1e2f3-b4c5-6789-defa-012345678901',
];

async function deleteMockReports() {
  console.log('🗑️  Suppression des signalements mockés...\n');

  const { data, error } = await supabase
    .from('reports')
    .delete()
    .in('author_id', mockUserIds)
    .select('id');

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  console.log(`✅ ${data?.length || 0} signalements mockés supprimés`);

  // Vérification
  const { data: remaining } = await supabase
    .from('reports')
    .select('id', { count: 'exact' });

  console.log(`📊 Signalements restants: ${remaining?.length || 0}`);
}

deleteMockReports().catch(console.error);
