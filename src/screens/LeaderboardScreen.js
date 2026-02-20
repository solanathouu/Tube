import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { XP_LEVELS } from '../theme/theme';

// Obtenir le niveau à partir de l'XP
const getLevelInfo = (xp) => {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0];
};

const LeaderboardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, getLeaderboard } = useApp();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [period, setPeriod] = useState('week'); // 'week' | 'month' | 'all'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(period);
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Erreur chargement leaderboard:', error);
    }
    setLoading(false);
  };

  const renderPodium = () => {
    if (leaderboard.length < 3) return null;

    const top3 = leaderboard.slice(0, 3);
    const [first, second, third] = top3;

    return (
      <View style={styles.podiumContainer}>
        {/* 2ème place */}
        <View style={styles.podiumItem}>
          <View style={[styles.podiumAvatar, styles.podiumSecond]}>
            <Text style={styles.podiumAvatarText}>
              {second?.username?.substring(0, 2).toUpperCase() || '??'}
            </Text>
            <View style={styles.podiumRankBadge}>
              <Text style={styles.podiumRankText}>2</Text>
            </View>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>{second?.username || '-'}</Text>
          <Text style={styles.podiumXP}>{second?.periodXP || 0} XP</Text>
          <View style={[styles.podiumBar, styles.podiumBarSecond]} />
        </View>

        {/* 1ère place */}
        <View style={styles.podiumItem}>
          <MaterialCommunityIcons name="crown" size={32} color="#FFD700" style={styles.crown} />
          <View style={[styles.podiumAvatar, styles.podiumFirst]}>
            <Text style={styles.podiumAvatarText}>
              {first?.username?.substring(0, 2).toUpperCase() || '??'}
            </Text>
            <View style={[styles.podiumRankBadge, styles.podiumRankFirst]}>
              <Text style={styles.podiumRankText}>1</Text>
            </View>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>{first?.username || '-'}</Text>
          <Text style={styles.podiumXP}>{first?.periodXP || 0} XP</Text>
          <View style={[styles.podiumBar, styles.podiumBarFirst]} />
        </View>

        {/* 3ème place */}
        <View style={styles.podiumItem}>
          <View style={[styles.podiumAvatar, styles.podiumThird]}>
            <Text style={styles.podiumAvatarText}>
              {third?.username?.substring(0, 2).toUpperCase() || '??'}
            </Text>
            <View style={[styles.podiumRankBadge, styles.podiumRankThird]}>
              <Text style={styles.podiumRankText}>3</Text>
            </View>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>{third?.username || '-'}</Text>
          <Text style={styles.podiumXP}>{third?.periodXP || 0} XP</Text>
          <View style={[styles.podiumBar, styles.podiumBarThird]} />
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    if (index < 3) return null; // Les 3 premiers sont sur le podium

    const levelInfo = getLevelInfo(item.xp || 0);
    const isCurrentUser = item.uid === user?.uid;

    return (
      <View style={[styles.rankItem, isCurrentUser && styles.rankItemCurrent]}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
        <View style={[styles.rankAvatar, { borderColor: levelInfo.color }]}>
          <Text style={styles.rankAvatarText}>
            {item.username?.substring(0, 2).toUpperCase() || '??'}
          </Text>
        </View>
        <View style={styles.rankInfo}>
          <View style={styles.rankNameRow}>
            <Text style={styles.rankBadge}>{levelInfo.badge}</Text>
            <Text style={[styles.rankName, isCurrentUser && styles.rankNameCurrent]}>
              {item.username}
            </Text>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>Vous</Text>
              </View>
            )}
          </View>
          <Text style={styles.rankLevel}>{levelInfo.name}</Text>
        </View>
        <View style={styles.rankXPContainer}>
          <Text style={styles.rankXP}>{item.periodXP || 0}</Text>
          <Text style={styles.rankXPLabel}>XP</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Sélecteur de période */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
            Semaine
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
            Mois
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'all' && styles.periodButtonActive]}
          onPress={() => setPeriod('all')}
        >
          <Text style={[styles.periodButtonText, period === 'all' && styles.periodButtonTextActive]}>
            Total
          </Text>
        </TouchableOpacity>
      </View>

      {/* Podium */}
      {renderPodium()}

      {/* Titre du reste du classement */}
      {leaderboard.length > 3 && (
        <Text style={styles.restTitle}>Classement</Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Classement</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>Aucun classement disponible</Text>
            <Text style={styles.emptySubtext}>Soyez le premier à gagner des XP !</Text>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            renderItem={renderItem}
            keyExtractor={(item) => item.uid}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
      width: 40,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.md,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    listContent: {
      paddingBottom: 100,
    },
    periodSelector: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    periodButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.round,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    periodButtonTextActive: {
      color: '#FFFFFF',
    },
    podiumContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.md,
    },
    podiumItem: {
      alignItems: 'center',
      flex: 1,
    },
    crown: {
      marginBottom: theme.spacing.xs,
    },
    podiumAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      position: 'relative',
    },
    podiumFirst: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#FFD700',
      borderColor: '#FFD700',
    },
    podiumSecond: {
      backgroundColor: '#C0C0C0',
      borderColor: '#C0C0C0',
    },
    podiumThird: {
      backgroundColor: '#CD7F32',
      borderColor: '#CD7F32',
    },
    podiumAvatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    podiumRankBadge: {
      position: 'absolute',
      bottom: -8,
      backgroundColor: '#C0C0C0',
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    podiumRankFirst: {
      backgroundColor: '#FFD700',
    },
    podiumRankThird: {
      backgroundColor: '#CD7F32',
    },
    podiumRankText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    podiumName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      maxWidth: 80,
    },
    podiumXP: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    podiumBar: {
      width: '80%',
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.sm,
    },
    podiumBarFirst: {
      height: 80,
      backgroundColor: '#FFD700',
    },
    podiumBarSecond: {
      height: 60,
      backgroundColor: '#C0C0C0',
    },
    podiumBarThird: {
      height: 40,
      backgroundColor: '#CD7F32',
    },
    restTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
    },
    rankItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    rankItemCurrent: {
      backgroundColor: theme.colors.primary + '15',
    },
    rankNumber: {
      width: 30,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    rankAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
      borderWidth: 2,
    },
    rankAvatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    rankInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    rankNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rankBadge: {
      fontSize: 14,
    },
    rankName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    rankNameCurrent: {
      color: theme.colors.primary,
    },
    youBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 4,
    },
    youBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    rankLevel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    rankXPContainer: {
      alignItems: 'center',
    },
    rankXP: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    rankXPLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
  });

export default LeaderboardScreen;
