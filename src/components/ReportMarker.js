import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, REPORT_TYPES } from '../theme/theme';
import { formatTimeAgo } from '../utils/helpers';

const ReportMarker = ({ report, onPress }) => {
  // Sur Android, on doit tracker les changements initialement puis désactiver
  const [tracksChanges, setTracksChanges] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (Platform.OS === 'android' && tracksChanges) {
      // Désactiver après le premier rendu pour les performances
      const timer = setTimeout(() => setTracksChanges(false), 500);
      return () => clearTimeout(timer);
    }
  }, []);
  const reportType = Object.values(REPORT_TYPES).find(t => t.id === report.type);

  // Gérer les votes (format array ou nombre)
  const presentCount = Array.isArray(report.votes?.present)
    ? report.votes.present.length
    : (report.votes?.present || 0);
  const absentCount = Array.isArray(report.votes?.absent)
    ? report.votes.absent.length
    : (report.votes?.absent || 0);
  const totalVotes = presentCount + absentCount;

  return (
    <Marker
      coordinate={report.coordinates}
      onPress={onPress}
      tracksViewChanges={tracksChanges}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.markerCircle, { backgroundColor: reportType?.color || theme.colors.primary }]}>
          <MaterialCommunityIcons
            name={reportType?.icon || 'alert'}
            size={24}
            color={theme.colors.surface}
          />
        </View>
        {totalVotes > 5 && (
          <View style={styles.voteBadge}>
            <Text style={styles.voteBadgeText}>{totalVotes}</Text>
          </View>
        )}
      </View>

      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <View style={styles.calloutHeader}>
            <MaterialCommunityIcons
              name={reportType?.icon || 'alert'}
              size={20}
              color={reportType?.color || theme.colors.primary}
            />
            <Text style={styles.calloutTitle}>{reportType?.label || 'Signalement'}</Text>
          </View>
          <Text style={styles.calloutSubtitle}>
            Ligne {report.line} • {report.stationName}
          </Text>
          <Text style={styles.calloutTime}>{formatTimeAgo(report.createdAt)}</Text>
          {report.comment && (
            <Text style={styles.calloutComment} numberOfLines={2}>
              "{report.comment}"
            </Text>
          )}
          <View style={styles.calloutVotes}>
            <View style={styles.voteItem}>
              <MaterialCommunityIcons name="thumb-up" size={16} color={theme.colors.success} />
              <Text style={styles.voteText}>{presentCount} Là</Text>
            </View>
            <View style={styles.voteItem}>
              <MaterialCommunityIcons name="thumb-down" size={16} color={theme.colors.danger} />
              <Text style={styles.voteText}>{absentCount} Pas là</Text>
            </View>
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  voteBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  voteBadgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  calloutContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minWidth: 200,
    maxWidth: 250,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 6,
  },
  calloutSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  calloutTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  calloutComment: {
    fontSize: 13,
    color: theme.colors.text,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  calloutVotes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  voteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default ReportMarker;
