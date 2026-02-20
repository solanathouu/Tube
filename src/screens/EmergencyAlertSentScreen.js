import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as liveShareService from '../services/liveShareService';

const EmergencyAlertSentScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const [hasActiveShare, setHasActiveShare] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    // Vérifier si un partage a été créé automatiquement
    const checkActiveShare = async () => {
      const result = await liveShareService.getActiveShares();
      if (result.success && result.shares && result.shares.length > 0) {
        const share = result.shares[0];
        setHasActiveShare(true);
        setShareUrl(liveShareService.getShareUrl(share.share_token));
      }
    };
    checkActiveShare();
  }, []);

  useEffect(() => {
    // Vibration de confirmation
    Vibration.vibrate([0, 100, 100, 100, 100, 100]);

    // Retour automatique après 5 secondes
    const timeout = setTimeout(() => {
      navigation.navigate('MainTabs');
    }, 5000);

    return () => {
      clearTimeout(timeout);
      Vibration.cancel();
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={120}
            color={theme.colors.success}
          />
        </View>

        <Text style={styles.title}>Alerte envoyée</Text>

        <Text style={styles.description}>
          Votre alerte d'urgence a été envoyée à tous les utilisateurs
          à proximité et sur votre ligne.
        </Text>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.infoText}>
            Restez en sécurité. Si vous êtes en danger immédiat,
            appelez les services d'urgence au 112.
          </Text>
        </View>

        {hasActiveShare && (
          <View style={styles.shareInfoBox}>
            <MaterialCommunityIcons
              name="share-variant"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.shareInfoContent}>
              <Text style={styles.shareInfoTitle}>Partage de trajet activé</Text>
              <Text style={styles.shareInfoText}>
                Vos proches peuvent suivre votre position en temps réel
              </Text>
              <TouchableOpacity
                style={styles.viewShareButton}
                onPress={() => navigation.navigate('LiveShare', { isEmergency: true })}
              >
                <Text style={styles.viewShareButtonText}>Voir le partage</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.emergencyCallButton}
          onPress={() => {
            Linking.openURL('tel:112');
          }}
        >
          <MaterialCommunityIcons name="phone" size={24} color="#FFFFFF" />
          <Text style={styles.emergencyCallText}>Appeler le 112</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.returnButtonText}>Retour à la carte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    iconContainer: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.success,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: 24,
      paddingHorizontal: theme.spacing.md,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
      alignItems: 'flex-start',
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
    emergencyCallButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.danger,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.sm,
      width: '100%',
      marginBottom: theme.spacing.md,
    },
    emergencyCallText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    returnButton: {
      padding: theme.spacing.md,
    },
    returnButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    shareInfoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
      alignItems: 'flex-start',
      width: '100%',
    },
    shareInfoContent: {
      flex: 1,
    },
    shareInfoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    shareInfoText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      lineHeight: 20,
    },
    viewShareButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'flex-start',
    },
    viewShareButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

export default EmergencyAlertSentScreen;
