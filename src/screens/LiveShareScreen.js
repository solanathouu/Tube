import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as liveShareService from '../services/liveShareService';
import * as locationTrackingService from '../services/locationTrackingService';

const LiveShareScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { userLocation } = useApp();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Paramètres depuis la route (si appelé depuis l'alarme)
  const isEmergency = route?.params?.isEmergency || false;
  const emergencyContacts = route?.params?.emergencyContacts || [];

  const [destinationName, setDestinationName] = useState('');
  const [etaMinutes, setEtaMinutes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeShare, setActiveShare] = useState(null);
  const [shareUrl, setShareUrl] = useState('');

  // Charger les partages actifs au démarrage
  useEffect(() => {
    loadActiveShares();
  }, []);

  const loadActiveShares = async () => {
    const result = await liveShareService.getActiveShares();
    if (result.success && result.shares && result.shares.length > 0) {
      const share = result.shares[0];
      setActiveShare(share);
      setShareUrl(liveShareService.getShareUrl(share.share_token));
      setDestinationName(share.destination_name || '');
    }
  };

  const handleStartShare = async () => {
    if (!userLocation) {
      Alert.alert('Erreur', 'Position GPS non disponible');
      return;
    }

    setLoading(true);

    try {
      // Calculer l'ETA si fourni
      const etaSeconds = etaMinutes ? parseInt(etaMinutes) * 60 : null;

      // Démarrer le partage
      const result = await liveShareService.startLiveShare({
        destinationName: destinationName || null,
        destinationLat: userLocation.latitude,
        destinationLng: userLocation.longitude,
        etaSeconds,
        autoShared: isEmergency,
        emergencyContactIds: emergencyContacts.map(c => c.id || c),
      });

      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible de démarrer le partage');
        setLoading(false);
        return;
      }

      // Démarrer le suivi de localisation
      const trackingResult = await locationTrackingService.startLocationTracking(
        result.share.id
      );

      if (!trackingResult.success) {
        console.warn('Suivi localisation:', trackingResult.error);
      }

      setActiveShare(result.share);
      setShareUrl(result.shareUrl);

      // Partager automatiquement le lien
      await shareLink(result.shareUrl);

      if (isEmergency) {
        // Si c'est une urgence, retourner à l'écran d'alarme
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erreur startShare:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleStopShare = async () => {
    if (!activeShare) return;

    Alert.alert(
      'Arrêter le partage',
      'Voulez-vous vraiment arrêter le partage de votre trajet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Arrêter',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await locationTrackingService.stopLocationTracking();
              const result = await liveShareService.stopLiveShare(activeShare.id);
              
              if (result.success) {
                setActiveShare(null);
                setShareUrl('');
                setDestinationName('');
                setEtaMinutes('');
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              console.error('Erreur stopShare:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const shareLink = async (url) => {
    try {
      await Share.share({
        message: `Suivez mon trajet en direct : ${url}`,
        url: url,
        title: 'Partager mon trajet',
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const copyToClipboard = async (text) => {
    // Pour React Native, on utilise Share avec juste le texte
    await Share.share({
      message: text,
    });
  };

  if (activeShare) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partage actif</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.activeShareCard}>
            <View style={styles.statusIndicator}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={24}
                color={theme.colors.success}
              />
              <Text style={styles.statusText}>Partage en cours</Text>
            </View>

            {activeShare.destination_name && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.infoText}>
                  Destination : {activeShare.destination_name}
                </Text>
              </View>
            )}

            <View style={styles.shareUrlContainer}>
              <Text style={styles.shareUrlLabel}>Lien de partage :</Text>
              <View style={styles.shareUrlBox}>
                <Text style={styles.shareUrl} numberOfLines={1}>
                  {shareUrl}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToClipboard(shareUrl)}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => shareLink(shareUrl)}
            >
              <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Partager le lien</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopShare}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="stop" size={20} color="#FFFFFF" />
                  <Text style={styles.stopButtonText}>Arrêter le partage</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.infoBoxText}>
              Vos proches peuvent suivre votre position en temps réel via le lien ci-dessus.
              Le partage s'arrêtera automatiquement à la fin de votre trajet ou vous pouvez
              l'arrêter manuellement.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEmergency ? 'Partage automatique' : 'Partager mon trajet'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {isEmergency && (
          <View style={styles.emergencyBanner}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={24}
              color={theme.colors.danger}
            />
            <Text style={styles.emergencyText}>
              Le partage sera activé automatiquement avec vos contacts favoris
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Gare du Nord"
              placeholderTextColor={theme.colors.textSecondary}
              value={destinationName}
              onChangeText={setDestinationName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Temps estimé (minutes, optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 15"
              placeholderTextColor={theme.colors.textSecondary}
              value={etaMinutes}
              onChangeText={setEtaMinutes}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.startButton, loading && styles.startButtonDisabled]}
            onPress={handleStartShare}
            disabled={loading || !userLocation}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>
                  {isEmergency ? 'Activer le partage' : 'Démarrer le partage'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!userLocation && (
            <Text style={styles.errorText}>
              Position GPS non disponible. Activez la localisation.
            </Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.infoBoxText}>
            Partagez votre position en temps réel avec vos proches. Ils pourront voir
            où vous êtes et où vous allez via un lien sécurisé.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    emergencyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    emergencyText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.danger,
      fontWeight: '600',
    },
    form: {
      marginBottom: theme.spacing.lg,
    },
    inputGroup: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 16,
      color: theme.colors.text,
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.danger,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    activeShareCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.success,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    shareUrlContainer: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    shareUrlLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    shareUrlBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    shareUrl: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    copyButton: {
      padding: theme.spacing.xs,
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    shareButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    stopButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.danger,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    stopButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
    },
    infoBoxText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
  });

export default LiveShareScreen;

