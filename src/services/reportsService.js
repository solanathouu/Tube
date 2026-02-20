import { supabase } from '../config/supabase';

/**
 * Créer un nouveau signalement
 */
export const createReport = async (reportData, userId, userInfo) => {
  try {
    const newReport = {
      type: reportData.type,
      station_id: reportData.stationId,
      station_name: reportData.stationName,
      line: reportData.line,
      coordinates: `POINT(${reportData.coordinates.longitude} ${reportData.coordinates.latitude})`,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      author_id: userId,
      author_username: userInfo.username,
      author_level: userInfo.level,
      author_xp: userInfo.xp,
      votes_present: [userId], // L'auteur vote automatiquement "présent"
      votes_absent: [],
      status: 'active',
      comment: reportData.comment || '',
      thanks: []
    };

    const { data, error } = await supabase
      .from('reports')
      .insert([newReport])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ [createReport] Signalement créé:', data.id);

    // Mettre à jour les stats utilisateur
    const { error: updateError } = await supabase
      .from('users')
      .update({
        xp: userInfo.xp + 10,
        total_reports: (userInfo.total_reports || 0) + 1
      })
      .eq('id', userId);

    if (updateError) console.error('❌ Erreur mise à jour stats:', updateError);

    return {
      success: true,
      reportId: data.id
    };
  } catch (error) {
    console.error('❌ [createReport] Erreur:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Récupérer tous les signalements actifs
 */
export const getActiveReports = async () => {
  console.log('🔍 [getActiveReports] Appel de la fonction...');
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Debug: voir le format des coordonnées
    if (data.length > 0) {
      console.log('📍 [getActiveReports] Format coordonnées:', typeof data[0].coordinates, data[0].coordinates);
      const parsed = parseCoordinates(data[0].coordinates);
      console.log('📍 [getActiveReports] Coordonnées parsées:', parsed);
    }

    // Convertir les données Supabase au format attendu par l'app
    const reports = data.map(report => ({
      id: report.id,
      type: report.type,
      stationId: report.station_id,
      stationName: report.station_name,
      line: report.line,
      coordinates: parseCoordinates(report.coordinates),
      createdAt: new Date(report.created_at),
      expiresAt: new Date(report.expires_at),
      authorId: report.author_id,
      author: {
        username: report.author_username,
        level: report.author_level,
        xp: report.author_xp
      },
      votes: {
        present: report.votes_present || [],
        absent: report.votes_absent || []
      },
      status: report.status,
      comment: report.comment || '',
      thanks: report.thanks || []
    }));

    return {
      success: true,
      reports
    };
  } catch (error) {
    console.error('Erreur getActiveReports:', error);
    return {
      success: false,
      error: error.message,
      reports: []
    };
  }
};

/**
 * Écouter les signalements en temps réel avec polling (sans Realtime Supabase)
 */
export const subscribeToReports = (callback) => {
  console.log('🔄 [subscribeToReports] Initialisation du polling (rafraîchissement toutes les 10s)...');

  // D'abord, charger les signalements existants
  getActiveReports().then(({ reports }) => {
    console.log('📥 [subscribeToReports] Chargement initial:', reports.length, 'signalements');
    callback(reports);
  });

  // Utiliser setInterval pour rafraîchir les données toutes les 10 secondes
  const pollInterval = setInterval(async () => {
    try {
      const { reports } = await getActiveReports();
      console.log('🔄 [subscribeToReports] Polling - Signalements récupérés:', reports.length);
      callback(reports);
    } catch (error) {
      console.error('❌ [subscribeToReports] Erreur lors du polling:', error);
    }
  }, 10000); // 10 secondes

  // Retourner une fonction de désabonnement qui arrête le polling
  return () => {
    console.log('🔴 [subscribeToReports] Arrêt du polling');
    clearInterval(pollInterval);
  };
};

/**
 * Voter sur un signalement
 */
export const voteOnReport = async (reportId, userId, voteType) => {
  try {
    // Récupérer le signalement actuel
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;
    if (!report) throw new Error('Signalement non trouvé');

    // Vérifier si l'utilisateur a déjà voté
    const hasVotedPresent = (report.votes_present || []).includes(userId);
    const hasVotedAbsent = (report.votes_absent || []).includes(userId);

    if (hasVotedPresent || hasVotedAbsent) {
      return {
        success: false,
        error: 'Vous avez déjà voté sur ce signalement'
      };
    }

    // Ajouter le vote
    const votesPresent = report.votes_present || [];
    const votesAbsent = report.votes_absent || [];

    const updateData = voteType === 'present'
      ? { votes_present: [...votesPresent, userId] }
      : { votes_absent: [...votesAbsent, userId] };

    const { error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId);

    if (updateError) throw updateError;

    // Mettre à jour les stats utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('xp, total_votes')
      .eq('id', userId)
      .single();

    if (userData) {
      await supabase
        .from('users')
        .update({
          xp: (userData.xp || 0) + 5,
          total_votes: (userData.total_votes || 0) + 1
        })
        .eq('id', userId);
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur voteOnReport:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Supprimer un signalement (seulement par l'auteur)
 */
export const deleteReport = async (reportId, userId) => {
  try {
    // Récupérer le signalement pour vérifier l'auteur
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('author_id')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;
    if (!report) throw new Error('Signalement non trouvé');

    // Vérifier que l'utilisateur est bien l'auteur
    if (report.author_id !== userId) {
      throw new Error('Vous ne pouvez supprimer que vos propres signalements');
    }

    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Erreur deleteReport:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Récupérer les signalements d'un utilisateur
 */
export const getUserReports = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Convertir au format attendu
    const reports = data.map(report => ({
      id: report.id,
      type: report.type,
      stationId: report.station_id,
      stationName: report.station_name,
      line: report.line,
      coordinates: parseCoordinates(report.coordinates),
      createdAt: new Date(report.created_at),
      expiresAt: new Date(report.expires_at),
      authorId: report.author_id,
      author: {
        username: report.author_username,
        level: report.author_level,
        xp: report.author_xp
      },
      votes: {
        present: report.votes_present || [],
        absent: report.votes_absent || []
      },
      status: report.status,
      comment: report.comment || '',
      thanks: report.thanks || []
    }));

    return {
      success: true,
      reports
    };
  } catch (error) {
    console.error('Erreur getUserReports:', error);
    return {
      success: false,
      error: error.message,
      reports: []
    };
  }
};

/**
 * Envoyer un merci sur un signalement
 */
export const thankReport = async (reportId, userId) => {
  try {
    // Récupérer le signalement actuel
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('thanks, author_id')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;
    if (!report) throw new Error('Signalement non trouvé');

    // Vérifier si l'utilisateur a déjà remercié
    const thanks = report.thanks || [];
    if (thanks.includes(userId)) {
      return { success: false, error: 'Vous avez déjà remercié ce signalement' };
    }

    // Ajouter le merci
    const { error: updateError } = await supabase
      .from('reports')
      .update({ thanks: [...thanks, userId] })
      .eq('id', reportId);

    if (updateError) throw updateError;

    // Incrémenter les remerciements reçus de l'auteur
    const { data: authorData } = await supabase
      .from('users')
      .select('total_thanks_received')
      .eq('id', report.author_id)
      .single();

    if (authorData) {
      await supabase
        .from('users')
        .update({ total_thanks_received: (authorData.total_thanks_received || 0) + 1 })
        .eq('id', report.author_id);
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur thankReport:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Marquer les signalements expirés (à appeler périodiquement)
 */
export const expireOldReports = async () => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('reports')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lte('expires_at', now)
      .select('id');

    if (error) throw error;

    return {
      success: true,
      expiredCount: data?.length || 0
    };
  } catch (error) {
    console.error('Erreur expireOldReports:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Helper: Parser les coordonnées depuis le format PostGIS
 * Supporte: WKB hex, WKT, GeoJSON, objet {latitude, longitude}
 */
const parseCoordinates = (coordinates) => {
  if (!coordinates) {
    console.log('⚠️ [parseCoordinates] Coordonnées null/undefined');
    return { latitude: 0, longitude: 0 };
  }

  // Si c'est déjà un objet avec latitude/longitude
  if (coordinates.latitude && coordinates.longitude) {
    return coordinates;
  }

  // Si c'est une string
  if (typeof coordinates === 'string') {
    // Format WKT: "POINT(lon lat)"
    const wktMatch = coordinates.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (wktMatch) {
      return {
        longitude: parseFloat(wktMatch[1]),
        latitude: parseFloat(wktMatch[2])
      };
    }

    // Format WKB hex (retourné par Supabase/PostGIS)
    // Ex: 0101000020E6100000E25817B7D100024061545227A0714840
    if (coordinates.match(/^[0-9A-Fa-f]+$/) && coordinates.length >= 42) {
      try {
        // WKB Point with SRID structure:
        // Byte 0: endianness (01 = little endian)
        // Bytes 1-4: type (01000020 = Point with SRID)
        // Bytes 5-8: SRID
        // Bytes 9-16: X (longitude) as double
        // Bytes 17-24: Y (latitude) as double
        const hex = coordinates;

        // Extraire longitude (bytes 18-34, soit caractères 36-51 en hex)
        const lonHex = hex.substring(18, 34);
        // Extraire latitude (bytes 34-50, soit caractères 34-50 en hex)
        const latHex = hex.substring(34, 50);

        const longitude = parseHexDouble(lonHex);
        const latitude = parseHexDouble(latHex);

        if (!isNaN(longitude) && !isNaN(latitude)) {
          return { longitude, latitude };
        }
      } catch (e) {
        console.error('Erreur parsing WKB:', e);
      }
    }
  }

  // Si c'est un objet GeoJSON
  if (coordinates.coordinates) {
    return {
      longitude: coordinates.coordinates[0],
      latitude: coordinates.coordinates[1]
    };
  }

  return { latitude: 0, longitude: 0 };
};

/**
 * Helper: Convertir une chaîne hex little-endian en double IEEE 754
 */
const parseHexDouble = (hex) => {
  // Inverser les bytes (little endian -> big endian)
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.unshift(hex.substring(i, i + 2));
  }
  const bigEndianHex = bytes.join('');

  // Convertir en buffer et lire comme double
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  for (let i = 0; i < 8; i++) {
    view.setUint8(i, parseInt(bigEndianHex.substring(i * 2, i * 2 + 2), 16));
  }

  return view.getFloat64(0);
};
