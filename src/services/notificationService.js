import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configuration par défaut des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Types de notifications
export const NOTIFICATION_TYPES = {
  PROXIMITY_ALERT: 'proximity_alert',      // Signalement proche de l'utilisateur
  FAVORITE_LINE: 'favorite_line',          // Signalement sur ligne favorite
  REPORT_VOTED: 'report_voted',            // Quelqu'un a voté sur votre signalement
  REPORT_VALIDATED: 'report_validated',    // Votre signalement a été validé
  LEVEL_UP: 'level_up',                    // Passage de niveau
  ACHIEVEMENT: 'achievement',              // Succès débloqué
  DAILY_REMINDER: 'daily_reminder',        // Rappel quotidien
  STREAK_WARNING: 'streak_warning',        // Avertissement streak en danger
  XP_BONUS: 'xp_bonus',                    // Bonus XP reçu
  EMERGENCY: 'emergency',                  // Alerte d'urgence (non désactivable)
};

// Catégories de notifications pour les préférences
export const NOTIFICATION_CATEGORIES = {
  ALERTS: {
    id: 'alerts',
    label: 'Alertes de proximité',
    description: 'Signalements proches de vous',
    icon: 'map-marker-alert',
    types: [NOTIFICATION_TYPES.PROXIMITY_ALERT],
  },
  FAVORITES: {
    id: 'favorites',
    label: 'Lignes favorites',
    description: 'Alertes sur vos lignes préférées',
    icon: 'star',
    types: [NOTIFICATION_TYPES.FAVORITE_LINE],
  },
  SOCIAL: {
    id: 'social',
    label: 'Activité sociale',
    description: 'Votes et validations de vos signalements',
    icon: 'account-group',
    types: [NOTIFICATION_TYPES.REPORT_VOTED, NOTIFICATION_TYPES.REPORT_VALIDATED],
  },
  GAMIFICATION: {
    id: 'gamification',
    label: 'Progression',
    description: 'Niveaux, succès et bonus XP',
    icon: 'trophy',
    types: [NOTIFICATION_TYPES.LEVEL_UP, NOTIFICATION_TYPES.ACHIEVEMENT, NOTIFICATION_TYPES.XP_BONUS],
  },
  REMINDERS: {
    id: 'reminders',
    label: 'Rappels',
    description: 'Rappels quotidiens et avertissements streak',
    icon: 'bell-ring',
    types: [NOTIFICATION_TYPES.DAILY_REMINDER, NOTIFICATION_TYPES.STREAK_WARNING],
  },
};

// Préférences par défaut
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: true,
  categories: {
    alerts: true,
    favorites: true,
    social: true,
    gamification: true,
    reminders: true,
  },
  proximityRadius: 500, // mètres
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

/**
 * Enregistre le device pour les push notifications
 * @returns {string|null} Le push token ou null si échec
 */
export const registerForPushNotifications = async () => {
  let token = null;

  // Vérifier si c'est un appareil physique
  if (!Device.isDevice) {
    console.log('Les notifications push nécessitent un appareil physique');
    return null;
  }

  // Vérifier les permissions existantes
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Demander les permissions si pas encore accordées
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission de notification refusée');
    return null;
  }

  // Obtenir le token Expo
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;

    console.log('Push token:', token);
  } catch (error) {
    console.error('Erreur obtention push token:', error);
    return null;
  }

  // Configuration spécifique Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications Tube',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });

    // Canal pour les alertes urgentes
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alertes de proximité',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#F44336',
    });

    // Canal pour la gamification
    await Notifications.setNotificationChannelAsync('gamification', {
      name: 'Progression et succès',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#FFD700',
    });
  }

  return token;
};

/**
 * Sauvegarde le push token dans Firestore
 * @param {string} userId - ID de l'utilisateur
 * @param {string} token - Push token
 */
export const savePushToken = async (userId, token) => {
  if (!userId || !token) return;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken: token,
      pushTokenUpdatedAt: new Date(),
      devicePlatform: Platform.OS,
    });
    console.log('Push token sauvegardé');
  } catch (error) {
    console.error('Erreur sauvegarde push token:', error);
  }
};

/**
 * Récupère les préférences de notifications de l'utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Préférences de notifications
 */
export const getNotificationPreferences = async (userId) => {
  try {
    const prefsRef = doc(db, 'users', userId, 'settings', 'notifications');
    const prefsSnap = await getDoc(prefsRef);

    if (prefsSnap.exists()) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefsSnap.data() };
    }

    // Créer les préférences par défaut si elles n'existent pas
    await setDoc(prefsRef, DEFAULT_NOTIFICATION_PREFERENCES);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  } catch (error) {
    console.error('Erreur récupération préférences notifications:', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
};

/**
 * Met à jour les préférences de notifications
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} preferences - Nouvelles préférences
 */
export const updateNotificationPreferences = async (userId, preferences) => {
  try {
    const prefsRef = doc(db, 'users', userId, 'settings', 'notifications');
    await setDoc(prefsRef, preferences, { merge: true });
    console.log('Préférences notifications mises à jour');
  } catch (error) {
    console.error('Erreur mise à jour préférences notifications:', error);
    throw error;
  }
};

/**
 * Envoie une notification locale
 * @param {Object} options - Options de la notification
 */
export const sendLocalNotification = async ({
  title,
  body,
  data = {},
  type = NOTIFICATION_TYPES.PROXIMITY_ALERT,
  channelId = 'default',
}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, type },
        sound: true,
      },
      trigger: null, // Notification immédiate
    });
  } catch (error) {
    console.error('Erreur envoi notification locale:', error);
  }
};

/**
 * Planifie une notification de rappel quotidien
 * @param {number} hour - Heure du rappel (0-23)
 * @param {number} minute - Minute du rappel (0-59)
 */
export const scheduleDailyReminder = async (hour = 18, minute = 0) => {
  try {
    // Annuler les rappels existants
    await cancelScheduledNotifications(NOTIFICATION_TYPES.DAILY_REMINDER);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bonus quotidien disponible !',
        body: 'Connectez-vous pour récupérer votre bonus XP et maintenir votre streak !',
        data: { type: NOTIFICATION_TYPES.DAILY_REMINDER },
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    console.log('Rappel quotidien programmé');
  } catch (error) {
    console.error('Erreur programmation rappel quotidien:', error);
  }
};

/**
 * Annule les notifications programmées d'un certain type
 * @param {string} type - Type de notification à annuler
 */
export const cancelScheduledNotifications = async (type) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduled) {
      if (notification.content.data?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Erreur annulation notifications:', error);
  }
};

/**
 * Annule toutes les notifications programmées
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Toutes les notifications annulées');
  } catch (error) {
    console.error('Erreur annulation toutes notifications:', error);
  }
};

// === NOTIFICATIONS SPÉCIFIQUES ===

/**
 * Notification de signalement à proximité
 */
export const notifyProximityAlert = async (report, distance) => {
  const distanceText = distance < 1000
    ? `${Math.round(distance)}m`
    : `${(distance / 1000).toFixed(1)}km`;

  await sendLocalNotification({
    title: `${report.typeLabel} à ${distanceText}`,
    body: `${report.stationName} - ${report.description || 'Signalement proche de vous'}`,
    data: { reportId: report.id, stationId: report.stationId },
    type: NOTIFICATION_TYPES.PROXIMITY_ALERT,
    channelId: 'alerts',
  });
};

/**
 * Notification de signalement sur ligne favorite
 */
export const notifyFavoriteLineAlert = async (report, lineName) => {
  await sendLocalNotification({
    title: `Alerte ${lineName}`,
    body: `${report.typeLabel} à ${report.stationName}`,
    data: { reportId: report.id, lineId: report.lineId },
    type: NOTIFICATION_TYPES.FAVORITE_LINE,
    channelId: 'alerts',
  });
};

/**
 * Notification de vote sur signalement
 */
export const notifyReportVoted = async (reportId, voteType, totalVotes) => {
  const voteText = voteType === 'up' ? 'confirmé' : 'infirmé';

  await sendLocalNotification({
    title: 'Nouveau vote sur votre signalement',
    body: `Quelqu'un a ${voteText} votre signalement (${totalVotes} votes)`,
    data: { reportId },
    type: NOTIFICATION_TYPES.REPORT_VOTED,
    channelId: 'default',
  });
};

/**
 * Notification de signalement validé
 */
export const notifyReportValidated = async (reportId, xpEarned) => {
  await sendLocalNotification({
    title: 'Signalement validé !',
    body: `Votre signalement a été validé par la communauté. +${xpEarned} XP`,
    data: { reportId, xpEarned },
    type: NOTIFICATION_TYPES.REPORT_VALIDATED,
    channelId: 'gamification',
  });
};

/**
 * Notification de passage de niveau
 */
export const notifyLevelUp = async (newLevel, levelName) => {
  await sendLocalNotification({
    title: 'Niveau supérieur !',
    body: `Félicitations ! Vous êtes maintenant ${levelName} (niveau ${newLevel})`,
    data: { level: newLevel },
    type: NOTIFICATION_TYPES.LEVEL_UP,
    channelId: 'gamification',
  });
};

/**
 * Notification de succès débloqué
 */
export const notifyAchievement = async (achievementName, xpEarned) => {
  await sendLocalNotification({
    title: 'Succès débloqué !',
    body: `${achievementName} - +${xpEarned} XP`,
    data: { achievement: achievementName, xpEarned },
    type: NOTIFICATION_TYPES.ACHIEVEMENT,
    channelId: 'gamification',
  });
};

/**
 * Notification d'avertissement streak
 */
export const notifyStreakWarning = async (currentStreak) => {
  await sendLocalNotification({
    title: 'Streak en danger !',
    body: `Connectez-vous aujourd'hui pour maintenir votre streak de ${currentStreak} jours !`,
    data: { streak: currentStreak },
    type: NOTIFICATION_TYPES.STREAK_WARNING,
    channelId: 'default',
  });
};

/**
 * Notification de bonus XP
 */
export const notifyXPBonus = async (amount, reason) => {
  await sendLocalNotification({
    title: `+${amount} XP !`,
    body: reason,
    data: { xp: amount },
    type: NOTIFICATION_TYPES.XP_BONUS,
    channelId: 'gamification',
  });
};

/**
 * Notification d'urgence - NON DÉSACTIVABLE
 * Envoyée à tous les utilisateurs à proximité et sur la même ligne
 */
export const notifyEmergency = async (senderUsername, stationName, lineName) => {
  await sendLocalNotification({
    title: '🚨 ALERTE URGENCE',
    body: `${senderUsername} signale une urgence à ${stationName} (${lineName})`,
    data: {
      type: NOTIFICATION_TYPES.EMERGENCY,
      isEmergency: true,
    },
    type: NOTIFICATION_TYPES.EMERGENCY,
    channelId: 'alerts',
  });
};

// === LISTENERS ===

/**
 * Ajoute un listener pour les notifications reçues (foreground)
 * @param {Function} callback - Fonction appelée à la réception
 * @returns {Object} Subscription à supprimer au cleanup
 */
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Ajoute un listener pour les interactions avec les notifications
 * @param {Function} callback - Fonction appelée lors d'une interaction
 * @returns {Object} Subscription à supprimer au cleanup
 */
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Récupère la dernière notification qui a ouvert l'app
 * @returns {Object|null} La réponse de notification ou null
 */
export const getLastNotificationResponse = async () => {
  return await Notifications.getLastNotificationResponseAsync();
};

/**
 * Efface le badge de l'app
 */
export const clearBadge = async () => {
  await Notifications.setBadgeCountAsync(0);
};

/**
 * Définit le nombre du badge
 * @param {number} count - Nombre à afficher
 */
export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};

export default {
  registerForPushNotifications,
  savePushToken,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendLocalNotification,
  scheduleDailyReminder,
  cancelScheduledNotifications,
  cancelAllNotifications,
  notifyProximityAlert,
  notifyFavoriteLineAlert,
  notifyReportVoted,
  notifyReportValidated,
  notifyLevelUp,
  notifyAchievement,
  notifyStreakWarning,
  notifyXPBonus,
  notifyEmergency,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  clearBadge,
  setBadgeCount,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  DEFAULT_NOTIFICATION_PREFERENCES,
};
