import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

const NotificationSettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const {
    notificationPreferences,
    updateNotificationPreferences,
    NOTIFICATION_CATEGORIES,
  } = useApp();

  const styles = useMemo(() => getStyles(theme), [theme]);

  // État local pour les modifications
  const [localPrefs, setLocalPrefs] = useState(notificationPreferences);
  const [saving, setSaving] = useState(false);

  // Mettre à jour une préférence locale
  const updateLocalPref = (key, value) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  // Mettre à jour une catégorie
  const updateCategory = (categoryId, enabled) => {
    setLocalPrefs(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryId]: enabled,
      },
    }));
  };

  // Sauvegarder les préférences
  const savePreferences = async () => {
    setSaving(true);
    try {
      const result = await updateNotificationPreferences(localPrefs);
      if (result.success) {
        Alert.alert('Succès', 'Vos préférences ont été sauvegardées');
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder les préférences');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
    setSaving(false);
  };

  // Vérifier si des modifications ont été faites
  const hasChanges = JSON.stringify(localPrefs) !== JSON.stringify(notificationPreferences);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {hasChanges ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={savePreferences}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

      {/* Toggle principal */}
      <View style={styles.section}>
        <View style={styles.mainToggle}>
          <View style={styles.toggleInfo}>
            <MaterialCommunityIcons
              name="bell"
              size={32}
              color={localPrefs.enabled ? theme.colors.primary : theme.colors.disabled}
            />
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Notifications</Text>
              <Text style={styles.toggleDescription}>
                {localPrefs.enabled ? 'Activées' : 'Désactivées'}
              </Text>
            </View>
          </View>
          <Switch
            value={localPrefs.enabled}
            onValueChange={(value) => updateLocalPref('enabled', value)}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Catégories */}
      {localPrefs.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          {Object.values(NOTIFICATION_CATEGORIES).map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <MaterialCommunityIcons
                  name={category.icon}
                  size={24}
                  color={
                    localPrefs.categories[category.id]
                      ? theme.colors.primary
                      : theme.colors.disabled
                  }
                />
                <View style={styles.categoryText}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
              </View>
              <Switch
                value={localPrefs.categories[category.id]}
                onValueChange={(value) => updateCategory(category.id, value)}
                trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>
      )}

      {/* Rayon de proximité */}
      {localPrefs.enabled && localPrefs.categories.alerts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rayon de proximité</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Alertes dans un rayon de{' '}
              <Text style={styles.sliderValue}>{localPrefs.proximityRadius}m</Text>
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={100}
              maximumValue={2000}
              step={100}
              value={localPrefs.proximityRadius}
              onValueChange={(value) => updateLocalPref('proximityRadius', value)}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.disabled}
              thumbTintColor={theme.colors.primary}
            />
            <View style={styles.sliderMarks}>
              <Text style={styles.sliderMark}>100m</Text>
              <Text style={styles.sliderMark}>1km</Text>
              <Text style={styles.sliderMark}>2km</Text>
            </View>
          </View>
        </View>
      )}

      {/* Heures de silence */}
      {localPrefs.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heures de silence</Text>
          <View style={styles.quietHoursToggle}>
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={24}
                color={
                  localPrefs.quietHoursEnabled
                    ? theme.colors.primary
                    : theme.colors.disabled
                }
              />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Mode silencieux</Text>
                <Text style={styles.toggleDescription}>
                  Pas de notifications pendant certaines heures
                </Text>
              </View>
            </View>
            <Switch
              value={localPrefs.quietHoursEnabled}
              onValueChange={(value) => updateLocalPref('quietHoursEnabled', value)}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {localPrefs.quietHoursEnabled && (
            <View style={styles.quietHoursTime}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  Alert.alert(
                    'Heure de début',
                    'Sélectionnez l\'heure de début du mode silencieux',
                    [
                      { text: '20:00', onPress: () => updateLocalPref('quietHoursStart', '20:00') },
                      { text: '21:00', onPress: () => updateLocalPref('quietHoursStart', '21:00') },
                      { text: '22:00', onPress: () => updateLocalPref('quietHoursStart', '22:00') },
                      { text: '23:00', onPress: () => updateLocalPref('quietHoursStart', '23:00') },
                      { text: 'Annuler', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.timeLabel}>Début</Text>
                <Text style={styles.timeValue}>{localPrefs.quietHoursStart}</Text>
              </TouchableOpacity>

              <MaterialCommunityIcons
                name="arrow-right"
                size={24}
                color={theme.colors.textSecondary}
              />

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => {
                  Alert.alert(
                    'Heure de fin',
                    'Sélectionnez l\'heure de fin du mode silencieux',
                    [
                      { text: '06:00', onPress: () => updateLocalPref('quietHoursEnd', '06:00') },
                      { text: '07:00', onPress: () => updateLocalPref('quietHoursEnd', '07:00') },
                      { text: '08:00', onPress: () => updateLocalPref('quietHoursEnd', '08:00') },
                      { text: '09:00', onPress: () => updateLocalPref('quietHoursEnd', '09:00') },
                      { text: 'Annuler', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.timeLabel}>Fin</Text>
                <Text style={styles.timeValue}>{localPrefs.quietHoursEnd}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <MaterialCommunityIcons
          name="information-outline"
          size={20}
          color={theme.colors.textSecondary}
        />
        <Text style={styles.infoText}>
          Les notifications vous alertent des signalements importants près de vous ou sur vos
          lignes favorites. Vous pouvez personnaliser les catégories de notifications que vous
          souhaitez recevoir.
        </Text>
      </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    placeholder: {
      width: 80,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      textAlign: 'center',
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    mainToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    toggleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    toggleText: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    toggleTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    toggleDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryText: {
      marginLeft: theme.spacing.md,
      flex: 1,
    },
    categoryLabel: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    categoryDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    sliderContainer: {
      paddingVertical: theme.spacing.sm,
    },
    sliderLabel: {
      fontSize: 15,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    sliderValue: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    sliderMarks: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.xs,
    },
    sliderMark: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    quietHoursToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    quietHoursTime: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    timeButton: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      minWidth: 100,
    },
    timeLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    timeValue: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 4,
    },
    infoSection: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    bottomSpacer: {
      height: 100,
    },
  });

export default NotificationSettingsScreen;
