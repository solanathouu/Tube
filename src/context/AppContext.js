import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { mockStations } from '../data/mockStations';
import { XP_REWARDS } from '../theme/theme';
import * as authService from '../services/authService';
import * as reportsService from '../services/reportsService';
import * as usersService from '../services/usersService';
import * as notificationService from '../services/notificationService';
import * as idfmService from '../services/idfmService';
import * as liveShareService from '../services/liveShareService';
import * as locationTrackingService from '../services/locationTrackingService';

const AppContext = createContext();

// Calcul de distance entre deux points (formule Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
};

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [notificationPreferences, setNotificationPreferences] = useState(
    notificationService.DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [pushToken, setPushToken] = useState(null);

  // État pour les données IDFM (perturbations officielles)
  const [officialDisruptions, setOfficialDisruptions] = useState([]);
  const [networkStatus, setNetworkStatus] = useState({});
  const [loadingDisruptions, setLoadingDisruptions] = useState(false);

  // Refs pour les listeners
  const notificationListener = useRef();
  const responseListener = useRef();
  const appStateRef = useRef(AppState.currentState);
  const notifiedReportsRef = useRef(new Set()); // Évite les notifications en double

  // Vérifier si l'utilisateur est connecté au démarrage
  useEffect(() => {
    const checkAuthState = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Récupérer les données complètes de l'utilisateur depuis Supabase
        const result = await usersService.getUser(currentUser.id);
        if (result.success) {
          setUser({ ...result.user, uid: currentUser.id });
          setIsAuthenticated(true);
        }
      }
      setLoading(false);
    };

    checkAuthState();

    // Écouter les changements d'état d'authentification Supabase
    const { data: authListener } = authService.onAuthStateChange(async (user) => {
      if (user) {
        const result = await usersService.getUser(user.id);
        if (result.success) {
          setUser({ ...result.user, uid: user.id });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Initialiser les notifications quand l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initNotifications = async () => {
      // Enregistrer pour les push notifications
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        setPushToken(token);
        await notificationService.savePushToken(user.uid, token);
      }

      // Charger les préférences
      const prefs = await notificationService.getNotificationPreferences(user.uid);
      setNotificationPreferences(prefs);

      // Programmer le rappel quotidien si activé
      if (prefs.enabled && prefs.categories.reminders) {
        await notificationService.scheduleDailyReminder(18, 0);
      }
    };

    initNotifications();

    // Listeners pour les notifications
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification reçue:', notification);
        // Traiter la notification en foreground si nécessaire
      }
    );

    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Interaction notification:', data);
        // Navigation vers le signalement si applicable
        // Cette logique sera gérée par la navigation
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, user?.uid]);

  // Vérifier les signalements à proximité pour les notifications
  const checkProximityNotifications = useCallback(async (location) => {
    if (!notificationPreferences.enabled || !notificationPreferences.categories.alerts) return;
    if (!location || !reports.length) return;

    const radius = notificationPreferences.proximityRadius || 500;

    reports.forEach(async (report) => {
      if (report.status !== 'active') return;
      if (notifiedReportsRef.current.has(report.id)) return;

      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        report.coordinates.latitude,
        report.coordinates.longitude
      );

      if (distance <= radius) {
        notifiedReportsRef.current.add(report.id);
        await notificationService.notifyProximityAlert(report, distance);
      }
    });
  }, [reports, notificationPreferences]);

  // Vérifier les signalements sur lignes favorites
  const checkFavoriteLineNotifications = useCallback(async (newReport) => {
    if (!notificationPreferences.enabled || !notificationPreferences.categories.favorites) return;
    if (!user?.preferences?.favoriteLines?.length) return;

    const favoriteLines = user.preferences.favoriteLines;

    if (favoriteLines.includes(newReport.line) && newReport.status === 'active') {
      if (!notifiedReportsRef.current.has(newReport.id)) {
        notifiedReportsRef.current.add(newReport.id);
        await notificationService.notifyFavoriteLineAlert(newReport, `Ligne ${newReport.line}`);
      }
    }
  }, [user?.preferences?.favoriteLines, notificationPreferences]);

  // Mettre à jour la position utilisateur
  const updateUserLocation = useCallback((location) => {
    setUserLocation(location);
    checkProximityNotifications(location);
  }, [checkProximityNotifications]);

  // S'abonner aux signalements en temps réel quand l'utilisateur est connecté
  useEffect(() => {
    console.log('🔵 [AppContext] useEffect subscribeToReports - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) return;

    console.log('✅ [AppContext] Abonnement aux signalements en temps réel...');
    const unsubscribe = reportsService.subscribeToReports((reportsData) => {
      console.log('📥 [AppContext] Callback reçu avec', reportsData.length, 'signalements');
      setReports(reportsData);
    });

    return () => {
      console.log('🔴 [AppContext] Désabonnement du listener');
      unsubscribe();
    };
  }, [isAuthenticated]);

  // Charger les perturbations officielles IDFM au démarrage et toutes les 2 minutes
  useEffect(() => {
    const loadOfficialDisruptions = async () => {
      setLoadingDisruptions(true);
      try {
        const [trafficResult, statusResult] = await Promise.all([
          idfmService.getTrafficInfo(),
          idfmService.getNetworkStatus(),
        ]);

        if (trafficResult.success) {
          setOfficialDisruptions(trafficResult.disruptions);
        }

        if (statusResult.success) {
          setNetworkStatus(statusResult.statusByLine || {});
        }
      } catch (error) {
        console.error('Erreur chargement perturbations IDFM:', error);
      } finally {
        setLoadingDisruptions(false);
      }
    };

    // Charger au démarrage
    loadOfficialDisruptions();

    // Rafraîchir toutes les 2 minutes
    const interval = setInterval(loadOfficialDisruptions, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Rafraîchir manuellement les perturbations
  const refreshDisruptions = useCallback(async () => {
    setLoadingDisruptions(true);
    try {
      const [trafficResult, statusResult] = await Promise.all([
        idfmService.getTrafficInfo(),
        idfmService.getNetworkStatus(),
      ]);

      if (trafficResult.success) {
        setOfficialDisruptions(trafficResult.disruptions);
      }

      if (statusResult.success) {
        setNetworkStatus(statusResult.statusByLine || {});
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur refresh perturbations:', error);
      return { success: false, error: error.message };
    } finally {
      setLoadingDisruptions(false);
    }
  }, []);

  // Obtenir les prochains passages à un arrêt
  const getNextDepartures = useCallback(async (stopId) => {
    try {
      const result = await idfmService.getNextDepartures(stopId);
      return result;
    } catch (error) {
      console.error('Erreur getNextDepartures:', error);
      return { success: false, error: error.message, departures: [] };
    }
  }, []);

  // Obtenir les perturbations pour une ligne spécifique
  const getLineDisruptions = useCallback(async (lineId) => {
    try {
      const result = await idfmService.getLineTrafficInfo(lineId);
      return result;
    } catch (error) {
      console.error('Erreur getLineDisruptions:', error);
      return { success: false, error: error.message, disruptions: [] };
    }
  }, []);

  // Obtenir le statut d'une ligne (ok, disrupted, interrupted)
  const getLineStatus = useCallback((lineId) => {
    const status = networkStatus[lineId];
    if (!status) return { status: 'ok', disruptions: [] };
    return status;
  }, [networkStatus]);

  // Calculer un itinéraire entre deux points
  const calculateRoute = useCallback(async (from, to, datetime = new Date()) => {
    try {
      const result = await idfmService.calculateRoute(from, to, datetime);
      return result;
    } catch (error) {
      console.error('Erreur calculateRoute:', error);
      return { success: false, error: error.message, journeys: [] };
    }
  }, []);

  // Rechercher des arrêts par nom
  const searchStops = useCallback(async (query, coords = null) => {
    try {
      const result = await idfmService.searchPlaces(query, coords);
      return result;
    } catch (error) {
      console.error('Erreur searchStops:', error);
      return { success: false, error: error.message, places: [] };
    }
  }, []);

  // Fonction de connexion avec Firebase
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur login:', error);
      return { success: false, error: 'Une erreur est survenue' };
    }
  };

  // Fonction d'inscription
  const signup = async (email, password, username) => {
    try {
      const result = await authService.signup(email, password, username);

      if (result.success) {
        const userId = result.user.id;
        console.log('✅ [AppContext.signup] Utilisateur créé avec ID:', userId);

        // Le profil est créé directement dans authService.signup
        // Plus besoin d'attendre le trigger
        const userData = await usersService.getUser(userId);

        if (!userData.success) {
          console.error('❌ [AppContext.signup] Impossible de récupérer le profil');
          return { success: false, error: 'Erreur lors de la création du profil' };
        }

        console.log('✅ [AppContext.signup] Profil récupéré:', userData.user);

        setUser({ ...userData.user, uid: userId });
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ [AppContext.signup] Erreur:', error);
      return { success: false, error: 'Une erreur est survenue' };
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setReports([]);
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  // Créer un nouveau signalement
  const createReport = async (reportData) => {
    if (!user) {
      console.error('❌ [createReport] Utilisateur non connecté');
      return { success: false, error: 'Utilisateur non connecté' };
    }

    if (!user.uid) {
      console.error('❌ [createReport] user.uid est undefined. user:', user);
      return { success: false, error: 'Utilisateur mal configuré (pas de uid)' };
    }

    console.log('✅ [createReport] user.uid:', user.uid);

    try {
      const station = mockStations.find(s => s.id === reportData.stationId);

      const reportPayload = {
        type: reportData.type,
        stationId: reportData.stationId,
        stationName: station?.name || reportData.stationName,
        line: station?.line || reportData.line,
        coordinates: station?.coordinates || reportData.coordinates,
        comment: reportData.comment || '',
      };

      const result = await reportsService.createReport(
        reportPayload,
        user.uid,
        {
          username: user.username || 'Anonyme',
          level: user.level || 1,
          xp: user.xp || 0
        }
      );

      if (result.success) {
        // Mettre à jour l'XP local de l'utilisateur
        const xpResult = await usersService.addXP(user.uid, XP_REWARDS.CREATE_REPORT);
        if (xpResult.success) {
          setUser(prev => ({
            ...prev,
            xp: xpResult.newXP,
            level: xpResult.newLevel
          }));
        }

        // TODO: Vérifier et débloquer les succès (fonction non implémentée)
        // await usersService.checkAndUnlockAchievements(user.uid);

        return { success: true, reportId: result.reportId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur createReport:', error);
      return { success: false, error: 'Erreur lors de la création du signalement' };
    }
  };

  // Voter sur un signalement
  const voteReport = async (reportId, voteType) => {
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    try {
      const result = await reportsService.voteOnReport(reportId, user.uid, voteType);

      if (result.success) {
        // Mettre à jour l'XP local
        const xpResult = await usersService.addXP(user.uid, XP_REWARDS.VOTE_CORRECT);
        if (xpResult.success) {
          setUser(prev => ({
            ...prev,
            xp: xpResult.newXP,
            level: xpResult.newLevel
          }));
        }

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur voteReport:', error);
      return { success: false, error: 'Erreur lors du vote' };
    }
  };

  // Ajouter/retirer une ligne des favoris
  const toggleFavoriteLine = async (lineId) => {
    if (!user) return;

    try {
      const isFavorite = user.preferences?.favoriteLines?.includes(lineId);

      if (isFavorite) {
        await usersService.removeFavoriteLine(user.uid, lineId);
        setUser(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            favoriteLines: prev.preferences.favoriteLines.filter(id => id !== lineId)
          }
        }));
      } else {
        await usersService.addFavoriteLine(user.uid, lineId);
        setUser(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            favoriteLines: [...(prev.preferences.favoriteLines || []), lineId]
          }
        }));
      }
    } catch (error) {
      console.error('Erreur toggleFavoriteLine:', error);
    }
  };

  // Mettre à jour les préférences de notifications (simple toggle)
  const updateNotifications = async (enabled) => {
    if (!user) return;

    try {
      await usersService.updateNotificationSettings(user.uid, enabled);
      setUser(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          notifications: enabled
        }
      }));

      // Mettre à jour aussi les préférences détaillées
      const newPrefs = { ...notificationPreferences, enabled };
      setNotificationPreferences(newPrefs);
      await notificationService.updateNotificationPreferences(user.uid, newPrefs);

      // Gérer le rappel quotidien
      if (enabled && notificationPreferences.categories.reminders) {
        await notificationService.scheduleDailyReminder(18, 0);
      } else {
        await notificationService.cancelScheduledNotifications(
          notificationService.NOTIFICATION_TYPES.DAILY_REMINDER
        );
      }
    } catch (error) {
      console.error('Erreur updateNotifications:', error);
    }
  };

  // Mettre à jour les préférences de notifications détaillées
  const updateNotificationPreferences = async (preferences) => {
    if (!user) return;

    try {
      const newPrefs = { ...notificationPreferences, ...preferences };
      setNotificationPreferences(newPrefs);
      await notificationService.updateNotificationPreferences(user.uid, newPrefs);

      // Mettre à jour le rappel quotidien si nécessaire
      if (newPrefs.enabled && newPrefs.categories.reminders) {
        await notificationService.scheduleDailyReminder(18, 0);
      } else {
        await notificationService.cancelScheduledNotifications(
          notificationService.NOTIFICATION_TYPES.DAILY_REMINDER
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur updateNotificationPreferences:', error);
      return { success: false, error: error.message };
    }
  };

  // Envoyer une notification de niveau supérieur
  const notifyLevelUp = async (newLevel, levelName) => {
    if (!notificationPreferences.enabled || !notificationPreferences.categories.gamification) return;
    await notificationService.notifyLevelUp(newLevel, levelName);
  };

  // Envoyer une notification de succès
  const notifyAchievement = async (achievementName, xpEarned) => {
    if (!notificationPreferences.enabled || !notificationPreferences.categories.gamification) return;
    await notificationService.notifyAchievement(achievementName, xpEarned);
  };

  // Envoyer une notification de vote sur signalement
  const notifyReportVoted = async (reportId, voteType, totalVotes) => {
    if (!notificationPreferences.enabled || !notificationPreferences.categories.social) return;
    await notificationService.notifyReportVoted(reportId, voteType, totalVotes);
  };

  // Envoyer une alerte d'urgence - NON DÉSACTIVABLE
  const sendEmergencyAlert = async (location) => {
    if (!user) return;

    try {
      // Trouver la station la plus proche de l'utilisateur
      let nearestStation = null;
      let minDistance = Infinity;

      if (location) {
        mockStations.forEach(station => {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            station.coordinates.latitude,
            station.coordinates.longitude
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestStation = station;
          }
        });
      }

      const stationName = nearestStation?.name || 'Position inconnue';
      const lineName = nearestStation ? `Ligne ${nearestStation.line}` : '';

      // Envoyer la notification locale (pour démonstration)
      // En production, cela enverrait une notification push via Firebase Cloud Messaging
      await notificationService.notifyEmergency(user.username, stationName, lineName);

      // Démarrer automatiquement le partage de trajet
      try {
        const shareResult = await liveShareService.startLiveShare({
          destinationName: stationName,
          destinationLat: nearestStation?.coordinates?.latitude || location?.latitude,
          destinationLng: nearestStation?.coordinates?.longitude || location?.longitude,
          autoShared: true,
          emergencyContactIds: [], // TODO: Récupérer les contacts favoris de l'utilisateur
        });

        if (shareResult.success) {
          // Démarrer le suivi de localisation
          await locationTrackingService.startLocationTracking(shareResult.share.id);
          console.log('Partage automatique démarré:', shareResult.shareUrl);
        }
      } catch (shareError) {
        console.warn('Erreur partage automatique:', shareError);
        // On continue même si le partage échoue
      }

      console.log('Alerte urgence envoyée:', {
        user: user.username,
        station: stationName,
        line: lineName,
        location,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur sendEmergencyAlert:', error);
      return { success: false, error: error.message };
    }
  };

  // Envoyer un merci sur un signalement
  const thankReport = async (reportId, authorUid) => {
    if (!user) return { success: false, error: 'Non connecté' };

    try {
      await reportsService.thankReport(reportId, user.uid);

      // Donner 2 XP à l'auteur du signalement (si ce n'est pas soi-même)
      if (authorUid && authorUid !== user.uid) {
        await usersService.addXP(authorUid, 2);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur thankReport:', error);
      return { success: false, error: error.message };
    }
  };

  // Récupérer le classement
  const getLeaderboard = async (period = 'week') => {
    try {
      const data = await usersService.getLeaderboard(period);
      return data;
    } catch (error) {
      console.error('Erreur getLeaderboard:', error);
      return [];
    }
  };

  // Mettre à jour la photo de profil
  const updateProfilePicture = async (imageUri) => {
    if (!user) return { success: false, error: 'Non connecté' };

    try {
      // Sauvegarder l'URI de l'image dans le profil utilisateur
      // Note: En production, on utiliserait Firebase Storage pour uploader l'image
      // et stocker l'URL. Ici on stocke l'URI en base64 ou local pour simplifier.
      await usersService.updateUserProfile(user.uid, {
        profilePicture: imageUri
      });

      setUser(prev => ({
        ...prev,
        profilePicture: imageUri
      }));

      return { success: true };
    } catch (error) {
      console.error('Erreur updateProfilePicture:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const result = await usersService.getUser(user.uid);
      if (result.success) {
        setUser({ ...result.user, uid: user.uid });
      }
    } catch (error) {
      console.error('Erreur refreshUser:', error);
    }
  };

  // Mettre à jour les trajets favoris
  const updateFavoriteRoutes = async (routes) => {
    if (!user) return;

    try {
      await usersService.updateUserProfile(user.uid, {
        'preferences.favoriteRoutes': routes
      });
      setUser(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          favoriteRoutes: routes
        }
      }));
      return { success: true };
    } catch (error) {
      console.error('Erreur updateFavoriteRoutes:', error);
      return { success: false, error: error.message };
    }
  };

  // Filtrer les signalements
  const setFilter = (filter) => {
    setActiveFilter(filter);
  };

  // Obtenir les signalements filtrés
  const getFilteredReports = () => {
    if (activeFilter === 'all') {
      return reports.filter(r => r.status === 'active');
    }
    return reports.filter(r => r.type === activeFilter && r.status === 'active');
  };

  const value = {
    isAuthenticated,
    user,
    reports,
    stations: mockStations,
    activeFilter,
    loading,
    userLocation,
    notificationPreferences,
    pushToken,
    // Données IDFM
    officialDisruptions,
    networkStatus,
    loadingDisruptions,
    // Fonctions auth
    login,
    signup,
    logout,
    // Fonctions reports
    createReport,
    voteReport,
    thankReport,
    // Fonctions utilisateur
    toggleFavoriteLine,
    updateNotifications,
    updateNotificationPreferences,
    updateUserLocation,
    updateProfilePicture,
    updateFavoriteRoutes,
    refreshUser,
    // Fonctions notifications
    notifyLevelUp,
    notifyAchievement,
    notifyReportVoted,
    sendEmergencyAlert,
    // Fonctions IDFM
    refreshDisruptions,
    getNextDepartures,
    getLineDisruptions,
    getLineStatus,
    calculateRoute,
    searchStops,
    // Autres
    getLeaderboard,
    setFilter,
    getFilteredReports,
    NOTIFICATION_CATEGORIES: notificationService.NOTIFICATION_CATEGORIES,
    LINE_IDS: idfmService.LINE_IDS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
