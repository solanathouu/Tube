import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import XPBar from '../components/XPBar';

const ProfileScreen = ({ navigation }) => {
  const { theme, themeMode, setTheme } = useTheme();
  const { user, logout, updateProfilePicture } = useApp();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Styles dynamiques basés sur le thème
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Adapter les données Supabase au format attendu
  const userStats = {
    totalReports: user?.total_reports || 0,
    validatedReports: user?.total_reports || 0, // À ajuster si vous avez ce champ
    totalVotes: user?.total_votes || 0,
    streak: user?.streak || 0,
  };

  const userAchievements = {
    firstReport: user?.badges?.includes('firstReport') || false,
    tenValidated: user?.badges?.includes('tenValidated') || false,
    silverLevel: (user?.level || 1) >= 3,
    hundredVotes: user?.badges?.includes('hundredVotes') || false,
    thirtyDayStreak: user?.badges?.includes('thirtyDayStreak') || false,
  };

  const userPreferences = {
    notifications: user?.preferences?.notifications ?? true,
    favoriteLines: user?.favorite_lines || user?.preferences?.favoriteLines || [],
    favoriteRoutes: user?.preferences?.favoriteRoutes || [],
  };

  const handleChangeProfilePicture = async () => {
    Alert.alert(
      'Photo de profil',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Choisir dans la galerie',
          onPress: () => pickImage('gallery'),
        },
        {
          text: 'Supprimer la photo',
          style: 'destructive',
          onPress: handleRemoveProfilePicture,
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      // Demander les permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire pour prendre une photo.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'L\'accès à la galerie est nécessaire pour choisir une photo.');
          return;
        }
      }

      // Lancer le picker
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true);
        const imageUri = result.assets[0].uri;

        const updateResult = await updateProfilePicture(imageUri);

        if (updateResult.success) {
          Alert.alert('Succès', 'Photo de profil mise à jour !');
        } else {
          Alert.alert('Erreur', updateResult.error || 'Impossible de mettre à jour la photo');
        }
        setUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Erreur pickImage:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
      setUploadingPhoto(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setUploadingPhoto(true);
    const result = await updateProfilePicture(null);
    if (result.success) {
      Alert.alert('Succès', 'Photo de profil supprimée');
    }
    setUploadingPhoto(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const achievements = [
    {
      id: 'first',
      label: 'Premier signalement',
      unlocked: userAchievements.firstReport,
      icon: 'flag-checkered',
    },
    {
      id: 'ten',
      label: '10 signalements validés',
      unlocked: userAchievements.tenValidated,
      icon: 'check-decagram',
    },
    {
      id: 'silver',
      label: 'Niveau Argent',
      unlocked: userAchievements.silverLevel,
      icon: 'medal',
    },
    {
      id: 'hundred',
      label: '100 votes corrects',
      unlocked: userAchievements.hundredVotes,
      icon: 'thumb-up-outline',
    },
    {
      id: 'streak',
      label: 'Streak 30 jours',
      unlocked: userAchievements.thirtyDayStreak,
      icon: 'fire',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header avec avatar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('EditProfile')}
        >
          <MaterialCommunityIcons name="pencil" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChangeProfilePicture} style={styles.avatarTouchable}>
            {uploadingPhoto ? (
              <View style={styles.avatar}>
                <ActivityIndicator color="#FFFFFF" size="large" />
              </View>
            ) : user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.username || 'U').substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{user?.username || 'Utilisateur'}</Text>
        </View>

        <View style={styles.xpContainer}>
          <XPBar currentXP={user?.xp || 0} />
        </View>
      </View>

      {/* Bouton Mes contacts */}
      <TouchableOpacity
        style={styles.leaderboardButton}
        onPress={() => navigation.navigate('Friends')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="account-multiple" size={24} color={theme.colors.primary} />
        <Text style={styles.leaderboardButtonText}>Mes contacts</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Bouton Classement */}
      <TouchableOpacity
        style={styles.leaderboardButton}
        onPress={() => navigation.navigate('Leaderboard')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
        <Text style={styles.leaderboardButtonText}>Voir le classement</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="plus-circle" size={32} color={theme.colors.primary} />
            <Text style={styles.statNumber}>{userStats.totalReports}</Text>
            <Text style={styles.statLabel}>Signalements</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="check-circle" size={32} color={theme.colors.success} />
            <Text style={styles.statNumber}>{userStats.validatedReports}</Text>
            <Text style={styles.statLabel}>Validés</Text>
            <Text style={styles.statPercentage}>
              {userStats.totalReports > 0 ? Math.round((userStats.validatedReports / userStats.totalReports) * 100) : 0}% précision
            </Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="vote" size={32} color={theme.colors.secondary} />
            <Text style={styles.statNumber}>{userStats.totalVotes}</Text>
            <Text style={styles.statLabel}>Votes</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={32} color={theme.colors.danger} />
            <Text style={styles.statNumber}>{userStats.streak}</Text>
            <Text style={styles.statLabel}>Jours de suite</Text>
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Succès</Text>
        <View style={styles.achievementsContainer}>
          {achievements.map(achievement => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                !achievement.unlocked && styles.achievementCardLocked,
              ]}
            >
              <MaterialCommunityIcons
                name={achievement.icon}
                size={40}
                color={achievement.unlocked ? theme.colors.warning : theme.colors.disabled}
              />
              <Text
                style={[
                  styles.achievementLabel,
                  !achievement.unlocked && styles.achievementLabelLocked,
                ]}
              >
                {achievement.label}
              </Text>
              {achievement.unlocked && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={theme.colors.success}
                  style={styles.achievementCheck}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Lignes favorites */}
      <TouchableOpacity
        style={styles.section}
        onPress={() => navigation.navigate('FavoriteLines')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lignes favorites</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.favoritesContainer}>
          {userPreferences.favoriteLines.length > 0 ? (
            userPreferences.favoriteLines.map(line => (
              <View key={line} style={styles.favoriteChip}>
                <Text style={styles.favoriteChipText}>{line}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noFavoritesText}>Aucune ligne favorite</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Trajets favoris */}
      <TouchableOpacity
        style={styles.section}
        onPress={() => navigation.navigate('FavoriteRoutes')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trajets quotidiens</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.routePreview}>
          <MaterialCommunityIcons name="routes" size={20} color={theme.colors.primary} />
          <Text style={styles.routePreviewText}>
            {userPreferences.favoriteRoutes.length > 0
              ? `${userPreferences.favoriteRoutes.length} trajet(s) configuré(s)`
              : 'Configurez vos trajets domicile-travail'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Paramètres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="bell" size={24} color={theme.colors.text} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {userPreferences.notifications ? 'Activées' : 'Désactivées'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                'Mode d\'affichage',
                'Choisissez le mode d\'affichage',
                [
                  { text: 'Clair', onPress: () => setTheme('light') },
                  { text: 'Sombre', onPress: () => setTheme('dark') },
                  { text: 'Automatique (système)', onPress: () => setTheme('system') },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
            }}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.colors.text} />
              <Text style={styles.settingLabel}>Mode d'affichage</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>
                {themeMode === 'system' ? 'Auto' : themeMode === 'dark' ? 'Sombre' : 'Clair'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="logout" size={24} color={theme.colors.danger} />
              <Text style={[styles.settingLabel, styles.logoutLabel]}>Déconnexion</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

// Styles dynamiques basés sur le thème
const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.secondary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  xpContainer: {
    marginTop: theme.spacing.md,
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  leaderboardButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statPercentage: {
    fontSize: 11,
    color: theme.colors.success,
    marginTop: 2,
    fontWeight: '500',
  },
  achievementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  achievementCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementLabel: {
    fontSize: 10,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  achievementLabelLocked: {
    color: theme.colors.textSecondary,
  },
  achievementCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  favoritesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  favoriteChip: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
  },
  favoriteChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noFavoritesText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 14,
  },
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  routePreviewText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  addFavoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addFavoriteText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  settingsContainer: {
    gap: theme.spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  logoutItem: {
    marginTop: theme.spacing.md,
  },
  logoutLabel: {
    color: theme.colors.danger,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ProfileScreen;
