import { supabase } from '../config/supabase';

/**
 * Inscription d'un nouvel utilisateur
 */
export const signup = async (email, password, username, phoneNumber = null) => {
  try {
    console.log('📝 [authService.signup] Création du compte pour:', email, username);

    // 1. Créer l'utilisateur dans Supabase Auth
    // Le trigger Supabase "handle_new_user" créera automatiquement le profil dans public.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          phone_number: phoneNumber
        }
      }
    });

    if (authError) {
      console.error('❌ [authService.signup] Erreur Auth:', authError);
      throw authError;
    }

    console.log('✅ [authService.signup] Compte Auth créé avec ID:', authData.user.id);

    // 2. Attendre un court instant pour laisser le trigger créer le profil
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Vérifier que le profil a bien été créé par le trigger
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      console.warn('⚠️ [authService.signup] Profil non trouvé après trigger, création manuelle...');
      
      // Fallback : créer le profil manuellement si le trigger n'a pas fonctionné
      const { data: newProfile, error: insertError} = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: email,
          username: username,
          phone_number: phoneNumber,
          xp: 0,
          level: 1,
          total_reports: 0,
          total_votes: 0,
          total_thanks_received: 0,
          total_work_sessions: 0,
          total_work_minutes: 0,
          favorite_lines: [],
          badges: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        // Si erreur "duplicate key", le profil existe déjà (créé par trigger)
        if (insertError.code === '23505') {
          console.log('✅ [authService.signup] Profil déjà créé par le trigger');
          // Récupérer le profil existant
          const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          return {
            success: true,
            user: authData.user,
            profile: existingProfile
          };
        }
        
        console.error('❌ [authService.signup] Erreur création profil:', insertError);
        throw new Error('Erreur lors de la création du profil: ' + insertError.message);
      }

      return {
        success: true,
        user: authData.user,
        profile: newProfile
      };
    }

    console.log('✅ [authService.signup] Profil créé par trigger:', profileData);

    return {
      success: true,
      user: authData.user,
      profile: profileData
    };
  } catch (error) {
    console.error('❌ [authService.signup] Erreur:', error);
    return {
      success: false,
      error: getErrorMessage(error.message)
    };
  }
};

/**
 * Connexion d'un utilisateur existant
 */
export const login = async (email, password) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Récupérer les données utilisateur depuis la table users
    let { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Si le profil n'existe pas, le créer automatiquement
    if (dbError && dbError.code === 'PGRST116') {
      console.log('⚠️ [login] Profil non trouvé, création automatique...');
      
      const username = authData.user.user_metadata?.username || email.split('@')[0];
      
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: email,
          username: username,
          xp: 0,
          level: 1,
          total_reports: 0,
          total_votes: 0,
          total_thanks_received: 0,
          total_work_sessions: 0,
          total_work_minutes: 0,
          favorite_lines: [],
          badges: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ [login] Erreur création profil:', insertError);
        throw new Error('Impossible de créer le profil utilisateur');
      }

      userData = newProfile;
      console.log('✅ [login] Profil créé:', userData);
    } else if (dbError) {
      throw dbError;
    }

    if (!userData) {
      throw new Error('Utilisateur non trouvé dans la base de données');
    }

    return {
      success: true,
      user: {
        ...userData,
        uid: userId,
        email: authData.user.email
      }
    };
  } catch (error) {
    console.error('Erreur login:', error);
    return {
      success: false,
      error: getErrorMessage(error.message)
    };
  }
};

/**
 * Déconnexion
 */
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erreur logout:', error);
    return {
      success: false,
      error: getErrorMessage(error.message)
    };
  }
};

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erreur reset password:', error);
    return {
      success: false,
      error: getErrorMessage(error.message)
    };
  }
};

/**
 * Récupérer l'utilisateur actuellement connecté
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Récupérer les données d'un utilisateur
 */
export const getUserData = async (uid) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error('Utilisateur non trouvé');
    }

    return {
      success: true,
      user: data
    };
  } catch (error) {
    console.error('Erreur getUserData:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Écouter les changements d'état d'authentification
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

/**
 * Messages d'erreur en français
 */
const getErrorMessage = (errorMessage) => {
  // Mapping des erreurs Supabase vers des messages en français
  const errorMap = {
    'User already registered': 'Cet email est déjà utilisé',
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Email non confirmé',
    'Password should be at least 6 characters': 'Mot de passe trop faible (minimum 6 caractères)',
    'Unable to validate email address: invalid format': 'Email invalide',
    'Email rate limit exceeded': 'Trop de tentatives. Réessayez plus tard',
    'Invalid email': 'Email invalide',
    'User not found': 'Aucun compte avec cet email',
    'Invalid password': 'Mot de passe incorrect'
  };

  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage?.includes(key)) {
      return value;
    }
  }

  return errorMessage || 'Une erreur est survenue';
};
