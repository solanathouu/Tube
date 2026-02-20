import { supabase } from '../config/supabase';

/**
 * Service pour le partage de trajet en live
 */

/**
 * Démarrer un partage de trajet
 * @param {Object} options - Options du partage
 * @param {string} options.destinationName - Nom de la destination
 * @param {number} options.destinationLat - Latitude destination
 * @param {number} options.destinationLng - Longitude destination
 * @param {number} options.etaSeconds - Temps estimé d'arrivée en secondes
 * @param {boolean} options.autoShared - Si partagé automatiquement (alarme)
 * @param {string[]} options.emergencyContactIds - IDs des contacts favoris
 * @returns {Promise<{success: boolean, share?: Object, token?: string, error?: string}>}
 */
export const startLiveShare = async (options = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // Générer un token unique
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_share_token');
    if (tokenError) {
      console.error('Erreur génération token:', tokenError);
      // Fallback : générer un token côté client
      const fallbackToken = generateFallbackToken();
      
      const { data, error } = await supabase
        .from('live_shares')
        .insert([{
          user_id: user.id,
          share_token: fallbackToken,
          destination_name: options.destinationName || null,
          destination_lat: options.destinationLat || null,
          destination_lng: options.destinationLng || null,
          eta_seconds: options.etaSeconds || null,
          auto_shared: options.autoShared || false,
          emergency_contact_ids: options.emergencyContactIds || [],
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        share: data,
        token: data.share_token,
        shareUrl: getShareUrl(data.share_token)
      };
    }

    const shareToken = tokenData || generateFallbackToken();

    const { data, error } = await supabase
      .from('live_shares')
      .insert([{
        user_id: user.id,
        share_token: shareToken,
        destination_name: options.destinationName || null,
        destination_lat: options.destinationLat || null,
        destination_lng: options.destinationLng || null,
        eta_seconds: options.etaSeconds || null,
        auto_shared: options.autoShared || false,
        emergency_contact_ids: options.emergencyContactIds || [],
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      share: data,
      token: data.share_token,
      shareUrl: getShareUrl(data.share_token)
    };
  } catch (error) {
    console.error('Erreur startLiveShare:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du démarrage du partage'
    };
  }
};

/**
 * Arrêter un partage de trajet
 * @param {string} shareId - ID du partage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const stopLiveShare = async (shareId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { error } = await supabase
      .from('live_shares')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', shareId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur stopLiveShare:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'arrêt du partage'
    };
  }
};

/**
 * Mettre à jour la position GPS
 * @param {string} shareId - ID du partage
 * @param {Object} position - Position GPS
 * @param {number} position.latitude
 * @param {number} position.longitude
 * @param {number} position.accuracy
 * @param {number} position.heading
 * @param {number} position.speed
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updatePosition = async (shareId, position) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // Vérifier que le partage appartient à l'utilisateur et est actif
    const { data: share, error: shareError } = await supabase
      .from('live_shares')
      .select('id, status')
      .eq('id', shareId)
      .eq('user_id', user.id)
      .single();

    if (shareError || !share) {
      return { success: false, error: 'Partage non trouvé' };
    }

    if (share.status !== 'active') {
      return { success: false, error: 'Partage terminé' };
    }

    const { error } = await supabase
      .from('live_share_positions')
      .insert([{
        share_id: shareId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy || null,
        heading: position.heading || null,
        speed: position.speed || null
      }]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur updatePosition:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de la position'
    };
  }
};

/**
 * Obtenir les informations d'un partage par token (pour la page web publique)
 * @param {string} token - Token du partage
 * @returns {Promise<{success: boolean, share?: Object, error?: string}>}
 */
export const getShareByToken = async (token) => {
  try {
    const { data, error } = await supabase
      .from('live_shares')
      .select('*')
      .eq('share_token', token)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return { success: false, error: 'Partage non trouvé ou terminé' };
    }

    return { success: true, share: data };
  } catch (error) {
    console.error('Erreur getShareByToken:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération du partage'
    };
  }
};

/**
 * Obtenir les dernières positions d'un partage
 * @param {string} token - Token du partage
 * @param {number} limit - Nombre de positions à récupérer
 * @returns {Promise<{success: boolean, positions?: Array, error?: string}>}
 */
export const getLatestPositions = async (token, limit = 50) => {
  try {
    const { data, error } = await supabase.rpc('get_latest_positions', {
      p_share_token: token,
      p_limit: limit
    });

    if (error) throw error;

    return { success: true, positions: data || [] };
  } catch (error) {
    console.error('Erreur getLatestPositions:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des positions'
    };
  }
};

/**
 * Obtenir les partages actifs de l'utilisateur
 * @returns {Promise<{success: boolean, shares?: Array, error?: string}>}
 */
export const getActiveShares = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('live_shares')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (error) throw error;

    return { success: true, shares: data || [] };
  } catch (error) {
    console.error('Erreur getActiveShares:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des partages'
    };
  }
};

/**
 * Générer un token de fallback côté client
 */
const generateFallbackToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Générer l'URL de partage
 */
export const getShareUrl = (token) => {
  // TODO: Remplacer par l'URL de votre site web
  return `https://tube-app.vercel.app/share/${token}`;
};

