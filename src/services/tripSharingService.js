import { supabase } from '../config/supabase';
import * as friendsService from './friendsService';

/**
 * Service de partage de trajets avec itinéraire
 */

/**
 * Démarrer un nouveau trajet
 */
export const startTrip = async (tripData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // Générer un token de partage
    const shareToken = generateShareToken();

    // Récupérer les amis avec partage automatique
    const { friends: autoShareFriends } = await friendsService.getActiveSharedFriends();
    const sharedWithIds = autoShareFriends.map(f => f.friend_id);

    const { data, error } = await supabase
      .from('active_trips')
      .insert([{
        user_id: user.id,
        trip_type: tripData.tripType || 'navigation',
        origin_name: tripData.originName,
        origin_lat: tripData.originLat,
        origin_lng: tripData.originLng,
        destination_name: tripData.destinationName,
        destination_lat: tripData.destinationLat,
        destination_lng: tripData.destinationLng,
        route_data: tripData.routeData || null,
        estimated_duration_seconds: tripData.estimatedDuration,
        share_token: shareToken,
        shared_with_friend_ids: sharedWithIds,
        auto_shared: tripData.autoShared || false,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      trip: data,
      shareToken: shareToken,
      sharedWithFriends: sharedWithIds
    };
  } catch (error) {
    console.error('Erreur startTrip:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du démarrage du trajet'
    };
  }
};

/**
 * Partager un trajet avec des amis spécifiques
 */
export const shareTripWithFriends = async (tripId, friendIds) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // Récupérer le trajet actuel
    const { data: trip, error: fetchError } = await supabase
      .from('active_trips')
      .select('shared_with_friend_ids')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Fusionner avec les IDs existants
    const existingIds = trip.shared_with_friend_ids || [];
    const newIds = [...new Set([...existingIds, ...friendIds])];

    const { error } = await supabase
      .from('active_trips')
      .update({ shared_with_friend_ids: newIds })
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true, sharedWith: newIds };
  } catch (error) {
    console.error('Erreur shareTripWithFriends:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du partage'
    };
  }
};

/**
 * Arrêter le partage avec certains amis
 */
export const unshareTripWithFriends = async (tripId, friendIds) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data: trip, error: fetchError } = await supabase
      .from('active_trips')
      .select('shared_with_friend_ids')
      .eq('id', tripId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    const existingIds = trip.shared_with_friend_ids || [];
    const newIds = existingIds.filter(id => !friendIds.includes(id));

    const { error } = await supabase
      .from('active_trips')
      .update({ shared_with_friend_ids: newIds })
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur unshareTripWithFriends:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Terminer un trajet
 */
export const completeTrip = async (tripId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { error } = await supabase
      .from('active_trips')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur completeTrip:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la fin du trajet'
    };
  }
};

/**
 * Annuler un trajet
 */
export const cancelTrip = async (tripId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { error } = await supabase
      .from('active_trips')
      .update({ status: 'cancelled' })
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur cancelTrip:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mettre à jour la position pendant un trajet
 */
export const updateTripPosition = async (tripId, position) => {
  try {
    const { error } = await supabase
      .from('trip_positions')
      .insert([{
        trip_id: tripId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy || null,
        heading: position.heading || null,
        speed: position.speed || null
      }]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur updateTripPosition:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtenir le trajet actif de l'utilisateur
 */
export const getActiveTrip = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('active_trips')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, trip: data };
  } catch (error) {
    console.error('Erreur getActiveTrip:', error);
    return {
      success: false,
      error: error.message,
      trip: null
    };
  }
};

/**
 * Obtenir le trajet d'un ami (si partagé)
 */
export const getFriendTrip = async (friendId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('active_trips')
      .select('*')
      .eq('user_id', friendId)
      .eq('status', 'active')
      .contains('shared_with_friend_ids', [user.id])
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, trip: data };
  } catch (error) {
    console.error('Erreur getFriendTrip:', error);
    return {
      success: false,
      error: error.message,
      trip: null
    };
  }
};

/**
 * Obtenir les dernières positions d'un trajet
 */
export const getTripPositions = async (tripId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('trip_positions')
      .select('*')
      .eq('trip_id', tripId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, positions: data || [] };
  } catch (error) {
    console.error('Erreur getTripPositions:', error);
    return {
      success: false,
      error: error.message,
      positions: []
    };
  }
};

/**
 * S'abonner aux positions d'un trajet en temps réel
 */
export const subscribeTripPositions = (tripId, callback) => {
  const subscription = supabase
    .channel(`trip_positions:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'trip_positions',
        filter: `trip_id=eq.${tripId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};

/**
 * Générer un token de partage aléatoire
 */
const generateShareToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export default {
  startTrip,
  shareTripWithFriends,
  unshareTripWithFriends,
  completeTrip,
  cancelTrip,
  updateTripPosition,
  getActiveTrip,
  getFriendTrip,
  getTripPositions,
  subscribeTripPositions
};

