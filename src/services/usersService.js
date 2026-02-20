import { supabase } from '../config/supabase';

/**
 * Récupère les informations d'un utilisateur par son ID
 */
export const getUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { success: true, user: data };
  } catch (error) {
    console.error('Erreur getUser:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour les informations d'un utilisateur
 */
export const updateUser = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, user: data };
  } catch (error) {
    console.error('Erreur updateUser:', error);
    
    // Gestion des erreurs spécifiques
    if (error.code === '23505') {
      if (error.message.includes('username')) {
        return { success: false, error: "Ce nom d'utilisateur est déjà pris" };
      }
      if (error.message.includes('phone_number')) {
        return { success: false, error: 'Ce numéro de téléphone est déjà utilisé' };
      }
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour la photo de profil d'un utilisateur
 */
export const updateProfilePicture = async (userId, photoUri) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ profile_picture: photoUri })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, user: data };
  } catch (error) {
    console.error('Erreur updateProfilePicture:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour l'XP d'un utilisateur
 */
export const updateUserXP = async (userId, xpToAdd) => {
  try {
    // Récupérer l'XP actuel
    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    const newXP = (userData.xp || 0) + xpToAdd;

    // Mettre à jour l'XP
    const { data, error } = await supabase
      .from('users')
      .update({ xp: newXP })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, user: data, xpAdded: xpToAdd };
  } catch (error) {
    console.error('Erreur updateUserXP:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Récupère le classement des utilisateurs par XP
 */
export const getLeaderboard = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, xp, profile_picture')
      .order('xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { success: true, leaderboard: data };
  } catch (error) {
    console.error('Erreur getLeaderboard:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Récupère la position d'un utilisateur dans le classement
 */
export const getUserRank = async (userId) => {
  try {
    // Récupérer l'XP de l'utilisateur
    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    // Compter combien d'utilisateurs ont plus d'XP
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('xp', userData.xp || 0);

    if (countError) throw countError;

    return { success: true, rank: (count || 0) + 1 };
  } catch (error) {
    console.error('Erreur getUserRank:', error);
    return { success: false, error: error.message };
  }
};

// Alias pour compatibilité avec AppContext
export const addXP = updateUserXP;

/**
 * Met à jour le profil utilisateur
 */
export const updateUserProfile = async (userId, updates) => {
  return updateUser(userId, updates);
};

/**
 * Ajoute une ligne aux favoris
 */
export const addFavoriteLine = async (userId, lineId) => {
  try {
    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select('favorite_lines')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    const currentLines = userData.favorite_lines || [];
    if (currentLines.includes(lineId)) {
      return { success: true }; // Déjà dans les favoris
    }

    const { error } = await supabase
      .from('users')
      .update({ favorite_lines: [...currentLines, lineId] })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur addFavoriteLine:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Retire une ligne des favoris
 */
export const removeFavoriteLine = async (userId, lineId) => {
  try {
    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select('favorite_lines')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    const currentLines = userData.favorite_lines || [];
    const updatedLines = currentLines.filter(id => id !== lineId);

    const { error } = await supabase
      .from('users')
      .update({ favorite_lines: updatedLines })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur removeFavoriteLine:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Met à jour les paramètres de notification
 */
export const updateNotificationSettings = async (userId, enabled) => {
  try {
    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    const currentPreferences = userData.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      notifications: enabled
    };

    const { error } = await supabase
      .from('users')
      .update({ preferences: updatedPreferences })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur updateNotificationSettings:', error);
    return { success: false, error: error.message };
  }
};
