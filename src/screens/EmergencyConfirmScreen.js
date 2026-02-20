import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

const COUNTDOWN_SECONDS = 3;

const EmergencyConfirmScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { sendEmergencyAlert, userLocation } = useApp();

  const styles = useMemo(() => getStyles(theme), [theme]);

  const [step, setStep] = useState('confirm'); // 'confirm' | 'countdown'
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [sending, setSending] = useState(false);

  const countdownInterval = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation de pulsation
  useEffect(() => {
    if (step === 'countdown') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [step, pulseAnim]);

  // Gestion du countdown
  useEffect(() => {
    if (step === 'countdown') {
      // Vibration pattern pour l'urgence
      Vibration.vibrate([0, 200, 100, 200]);

      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            handleSendAlert();
            return 0;
          }
          // Vibration à chaque seconde
          Vibration.vibrate(100);
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
        Vibration.cancel();
      };
    }
  }, [step]);

  const handleConfirm = () => {
    setStep('countdown');
  };

  const handleCancel = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    Vibration.cancel();
    navigation.goBack();
  };

  const handleSendAlert = async () => {
    setSending(true);
    try {
      await sendEmergencyAlert(userLocation);
      // Afficher confirmation et retourner
      navigation.replace('EmergencyAlertSent');
    } catch (error) {
      console.error('Erreur envoi alerte urgence:', error);
      navigation.goBack();
    }
  };

  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="alert-octagon"
              size={100}
              color={theme.colors.danger}
            />
          </View>

          <Text style={styles.title}>Alerte d'urgence</Text>
          <Text style={styles.description}>
            En cas de danger immédiat, cette alerte notifiera tous les utilisateurs
            à proximité et sur votre ligne.
          </Text>

          <Text style={styles.warning}>
            N'utilisez cette fonction qu'en cas de réelle urgence.
          </Text>

          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="alert" size={32} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>CONFIRMER L'URGENCE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Étape countdown
  return (
    <SafeAreaView style={[styles.container, styles.countdownContainer]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.countdownCircle,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.countdownNumber}>{countdown}</Text>
        </Animated.View>

        <Text style={styles.countdownTitle}>Envoi de l'alerte dans...</Text>

        <Text style={styles.countdownDescription}>
          Une notification d'urgence sera envoyée à tous les utilisateurs
          à proximité et sur votre ligne.
        </Text>

        {sending ? (
          <View style={styles.sendingContainer}>
            <MaterialCommunityIcons
              name="loading"
              size={32}
              color={theme.colors.danger}
            />
            <Text style={styles.sendingText}>Envoi en cours...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.cancelCountdownButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close-circle" size={24} color="#FFFFFF" />
            <Text style={styles.cancelCountdownText}>ANNULER</Text>
          </TouchableOpacity>
        )}
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
    countdownContainer: {
      backgroundColor: '#1a0000',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    closeButton: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      padding: theme.spacing.sm,
      zIndex: 10,
    },
    iconContainer: {
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.danger,
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 24,
      paddingHorizontal: theme.spacing.md,
    },
    warning: {
      fontSize: 14,
      color: theme.colors.warning,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      fontWeight: '600',
    },
    emergencyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.danger,
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.md,
      width: '100%',
      elevation: 4,
      shadowColor: theme.colors.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    emergencyButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    cancelButton: {
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
    },
    cancelButtonText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    // Countdown styles
    countdownCircle: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.colors.danger,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      elevation: 8,
      shadowColor: theme.colors.danger,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
    },
    countdownNumber: {
      fontSize: 80,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    countdownTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: theme.spacing.md,
      textAlign: 'center',
    },
    countdownDescription: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: 22,
      paddingHorizontal: theme.spacing.lg,
    },
    cancelCountdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.round,
      gap: theme.spacing.sm,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    cancelCountdownText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    sendingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    sendingText: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

export default EmergencyConfirmScreen;
