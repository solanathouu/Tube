import { supabase } from '../config/supabase';

/**
 * Service de gestion des amis et du réseau social
 */

/**
 * Envoyer une demande d'ami
 */
export const sendFriendRequest = async (recipientId, message = '') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{
        sender_id: user.id,
        recipient_id: recipientId,
        message: message,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    return { success: true, request: data };
  } catch (error) {
    console.error('Erreur sendFriendRequest:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'envoi de la demande'
    };
  }
};

/**
 * Accepter une demande d'ami
 */
export const acceptFriendRequest = async (requestId) => {
  try {
    const { data, error } = await supabase.rpc('accept_friend_request', {
      p_request_id: requestId
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur acceptFriendRequest:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'acceptation'
    };
  }
};

/**
 * Refuser une demande d'ami
 */
export const rejectFriendRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur rejectFriendRequest:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du refus'
    };
  }
};

/**
 * Annuler une demande envoyée
 */
export const cancelFriendRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur cancelFriendRequest:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'annulation'
    };
  }
};

/**
 * Retirer un ami
 */
export const removeFriend = async (friendId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // Supprimer les deux relations (bidirectionnelle)
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`user_id.eq.${user.id},user_id.eq.${friendId}`)
      .or(`friend_id.eq.${user.id},friend_id.eq.${friendId}`);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur removeFriend:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    };
  }
};

/**
 * Obtenir la liste des amis avec leur statut
 */
export const getFriendsWithStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase.rpc('get_friends_with_status', {
      p_user_id: user.id
    });

    if (error) throw error;

    return { success: true, friends: data || [] };
  } catch (error) {
    console.error('Erreur getFriendsWithStatus:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des amis',
      friends: []
    };
  }
};

/**
 * Obtenir les demandes d'amis reçues
 */
export const getReceivedRequests = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          email
        )
      `)
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, requests: data || [] };
  } catch (error) {
    console.error('Erreur getReceivedRequests:', error);
    return {
      success: false,
      error: error.message,
      requests: []
    };
  }
};

/**
 * Obtenir les demandes envoyées
 */
export const getSentRequests = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        recipient:recipient_id (
          id,
          username,
          email
        )
      `)
      .eq('sender_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, requests: data || [] };
  } catch (error) {
    console.error('Erreur getSentRequests:', error);
    return {
      success: false,
      error: error.message,
      requests: []
    };
  }
};

/**
 * Rechercher des utilisateurs
 */
export const searchUsers = async (query) => {
  try {
    if (!query || query.length < 2) {
      return { success: true, users: [] };
    }

    const { data, error } = await supabase.rpc('search_users_by_username', {
      p_query: query,
      p_limit: 20
    });

    if (error) throw error;

    return { success: true, users: data || [] };
  } catch (error) {
    console.error('Erreur searchUsers:', error);
    return {
      success: false,
      error: error.message,
      users: []
    };
  }
};

/**
 * Mettre à jour les permissions de partage avec un ami
 */
export const updateSharePermissions = async (friendId, permissions) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('share_permissions')
      .upsert({
        user_id: user.id,
        friend_id: friendId,
        can_see_location: permissions.canSeeLocation || false,
        can_see_trips: permissions.canSeeTrips || false,
        always_share: permissions.alwaysShare || false,
        notify_on_trip_start: permissions.notifyOnTripStart || false
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, permissions: data };
  } catch (error) {
    console.error('Erreur updateSharePermissions:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour des permissions'
    };
  }
};

/**
 * Obtenir les permissions de partage avec un ami
 */
export const getSharePermissions = async (friendId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('share_permissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('friend_id', friendId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return {
      success: true,
      permissions: data || {
        can_see_location: false,
        can_see_trips: false,
        always_share: false,
        notify_on_trip_start: false
      }
    };
  } catch (error) {
    console.error('Erreur getSharePermissions:', error);
    return {
      success: false,
      error: error.message,
      permissions: null
    };
  }
};

/**
 * Obtenir les amis avec qui on partage actuellement sa position
 */
export const getActiveSharedFriends = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    const { data, error } = await supabase
      .from('share_permissions')
      .select(`
        friend_id,
        always_share,
        can_see_location,
        can_see_trips,
        friend:friend_id (
          id,
          username,
          email
        )
      `)
      .eq('user_id', user.id)
      .eq('always_share', true);

    if (error) throw error;

    return { success: true, friends: data || [] };
  } catch (error) {
    console.error('Erreur getActiveSharedFriends:', error);
    return {
      success: false,
      error: error.message,
      friends: []
    };
  }
};

export default {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendsWithStatus,
  getReceivedRequests,
  getSentRequests,
  searchUsers,
  updateSharePermissions,
  getSharePermissions,
  getActiveSharedFriends
};

