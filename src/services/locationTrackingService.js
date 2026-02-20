import * as Location from 'expo-location';
import * as liveShareService from './liveShareService';

// Note: expo-task-manager est nécessaire pour le suivi en arrière-plan
// Il sera installé automatiquement avec expo-location dans les builds standalone
// Pour Expo Go, seul le suivi foreground fonctionnera
let TaskManager = null;
try {
  TaskManager = require('expo-task-manager');
} catch (e) {
  console.warn('expo-task-manager non disponible (normal en Expo Go)');
}

const LOCATION_TASK_NAME = 'background-location-tracking';
const UPDATE_INTERVAL = 10000; // 10 secondes

let activeShareId = null;
let locationSubscription = null;

/**
 * Service de suivi de localisation en arrière-plan
 * Compatible avec les builds standalone (pas Expo Go)
 */

/**
 * Démarrer le suivi de localisation pour un partage
 * @param {string} shareId - ID du partage actif
 * @param {Object} options - Options de suivi
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const startLocationTracking = async (shareId, options = {}) => {
  try {
    // Demander les permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Permission de localisation refusée' };
    }

    // Pour l'arrière-plan, demander aussi la permission background
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('Permission arrière-plan non accordée, suivi limité au foreground');
    }

    activeShareId = shareId;

    // Option 1 : Suivi en foreground (fonctionne partout)
    await startForegroundTracking(shareId, options);

    // Option 2 : Suivi en arrière-plan (nécessite un build standalone)
    if (backgroundStatus === 'granted') {
      await startBackgroundTracking(shareId, options);
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur startLocationTracking:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du démarrage du suivi'
    };
  }
};

/**
 * Suivi en foreground (fonctionne même avec Expo Go)
 */
const startForegroundTracking = async (shareId, options) => {
  // Arrêter le suivi précédent si existant
  if (locationSubscription) {
    locationSubscription.remove();
  }

  // Configuration de la localisation
  const locationOptions = {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: UPDATE_INTERVAL,
    distanceInterval: 10, // Mettre à jour tous les 10 mètres
    mayShowUserSettingsDialog: true,
  };

  // Démarrer le suivi
  locationSubscription = await Location.watchPositionAsync(
    locationOptions,
    async (location) => {
      await updateSharePosition(shareId, location);
    }
  );
};

/**
 * Suivi en arrière-plan (nécessite build standalone)
 */
const startBackgroundTracking = async (shareId, options) => {
  if (!TaskManager) {
    console.warn('TaskManager non disponible, suivi arrière-plan désactivé');
    return;
  }

  try {
    // Définir la tâche de background si pas déjà définie
    const isTaskDefined = await TaskManager.isTaskDefinedAsync(LOCATION_TASK_NAME);
    if (!isTaskDefined) {
      TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
        if (error) {
          console.error('Erreur tâche background:', error);
          return;
        }

        if (data) {
          const { locations } = data;
          if (locations && locations.length > 0) {
            const location = locations[0];
            updateSharePosition(shareId, {
              coords: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                heading: location.coords.heading,
                speed: location.coords.speed,
              },
              timestamp: location.timestamp,
            });
          }
        }
      });
    }

    // Démarrer la tâche de background
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: UPDATE_INTERVAL,
      distanceInterval: 10,
      foregroundService: {
        notificationTitle: 'Partage de trajet actif',
        notificationBody: 'Votre position est partagée en temps réel',
        notificationColor: '#2196F3',
      },
    });
  } catch (error) {
    console.warn('Impossible de démarrer le suivi en arrière-plan:', error);
    // On continue avec le suivi foreground uniquement
  }
};

/**
 * Arrêter le suivi de localisation
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const stopLocationTracking = async () => {
  try {
    // Arrêter le suivi foreground
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    // Arrêter le suivi background
    if (TaskManager) {
      const isTaskDefined = await TaskManager.isTaskDefinedAsync(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isRunning) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      }
    }

    activeShareId = null;
    return { success: true };
  } catch (error) {
    console.error('Erreur stopLocationTracking:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'arrêt du suivi'
    };
  }
};

/**
 * Mettre à jour la position dans le partage
 */
const updateSharePosition = async (shareId, location) => {
  try {
    const position = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || null,
      heading: location.coords.heading || null,
      speed: location.coords.speed || null,
    };

    await liveShareService.updatePosition(shareId, position);
  } catch (error) {
    console.error('Erreur updateSharePosition:', error);
  }
};

/**
 * Vérifier si le suivi est actif
 */
export const isTrackingActive = () => {
  return activeShareId !== null;
};

/**
 * Obtenir l'ID du partage actif
 */
export const getActiveShareId = () => {
  return activeShareId;
};

