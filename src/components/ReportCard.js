import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, REPORT_TYPES, XP_LEVELS } from '../theme/theme';
import { formatTimeAgo, getTimeRemaining, calculateConfidenceScore } from '../utils/helpers';

// Obtenir le niveau à partir de l'XP
const getLevelInfo = (xp) => {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0];
};

const ReportCard = ({ report, onPress, onVote, onThanks }) => {
  const reportType = Object.values(REPORT_TYPES).find(t => t.id === report.type);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(report.expiresAt));
  const progressPercent = (timeRemaining / 10) * 100; // Sur 10 minutes max
  const confidenceScore = calculateConfidenceScore(report);

  // Obtenir les infos de niveau de l'auteur
  const authorLevel = getLevelInfo(report.author?.xp || 0);

  // Mettre à jour le compte à rebours toutes les secondes pour plus de précision
  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getTimeRemaining(report.expiresAt);
      setTimeRemaining(newTime);
    }, 1000); // Mise à jour chaque seconde

    return () => clearInterval(interval);
  }, [report.expiresAt]);

  // Calculer les votes
  const presentCount = Array.isArray(report.votes?.present)
    ? report.votes.present.length
    : (report.votes?.present || 0);
  const absentCount = Array.isArray(report.votes?.absent)
    ? report.votes.absent.length
    : (report.votes?.absent || 0);

  // Formater l'heure du signalement
  const formatCreatedAt = (timestamp) => {
    if (!timestamp) return 'À l\'instant';

    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Ligne du haut */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={[styles.iconCircle, { backgroundColor: reportType?.color + '20' }]}>
            <MaterialCommunityIcons
              name={reportType?.icon || 'alert'}
              size={24}
              color={reportType?.color || theme.colors.text}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{reportType?.label || 'Signalement'}</Text>
            <Text style={styles.subtitle}>
              Ligne {report.line} • {report.stationName}
            </Text>
          </View>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceScore}>{confidenceScore}%</Text>
          <Text style={styles.confidenceLabel}>sûr</Text>
        </View>
      </View>

      {/* Info auteur avec badge niveau */}
      <View style={styles.authorRow}>
        <Text style={styles.caption}>
          Signalé à {formatCreatedAt(report.createdAt)} par
        </Text>
        <View style={styles.authorBadge}>
          <Text style={styles.authorBadgeEmoji}>{authorLevel.badge}</Text>
          <Text style={[styles.authorName, { color: authorLevel.color }]}>
            @{report.author?.username || 'Anonyme'}
          </Text>
        </View>
      </View>

      {/* Commentaire */}
      {report.comment && (
        <Text style={styles.comment} numberOfLines={2}>
          "{report.comment}"
        </Text>
      )}

      {/* Votes et Merci */}
      <View style={styles.voteSection}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={(e) => {
            e.stopPropagation();
            onVote?.(report.id, 'present');
          }}
        >
          <MaterialCommunityIcons name="thumb-up" size={20} color={theme.colors.success} />
          <Text style={[styles.voteText, { color: theme.colors.success }]}>{presentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voteButton}
          onPress={(e) => {
            e.stopPropagation();
            onVote?.(report.id, 'absent');
          }}
        >
          <MaterialCommunityIcons name="thumb-down" size={20} color={theme.colors.danger} />
          <Text style={[styles.voteText, { color: theme.colors.danger }]}>{absentCount}</Text>
        </TouchableOpacity>

        {/* Bouton Merci */}
        <TouchableOpacity
          style={styles.thanksButton}
          onPress={(e) => {
            e.stopPropagation();
            onThanks?.(report.id, report.author?.uid);
          }}
        >
          <MaterialCommunityIcons name="heart" size={18} color={theme.colors.secondary} />
          <Text style={styles.thanksText}>
            {report.thanks?.length || 0}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barre de progression + Expiration */}
      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
                backgroundColor:
                  progressPercent > 50
                    ? theme.colors.success
                    : progressPercent > 20
                    ? theme.colors.warning
                    : theme.colors.danger,
              },
            ]}
          />
        </View>
        <Text style={styles.expiryText}>
          {timeRemaining > 0
            ? `Expire dans ${timeRemaining} min`
            : 'Expiré'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  confidenceContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
  },
  confidenceScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  confidenceLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  caption: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  authorBadgeEmoji: {
    fontSize: 12,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  comment: {
    fontSize: 13,
    color: theme.colors.text,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
  },
  voteSection: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  voteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  thanksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.secondary + '15',
    marginLeft: 'auto',
  },
  thanksText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  footer: {
    marginTop: theme.spacing.sm,
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  expiryText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
});

export default ReportCard;
