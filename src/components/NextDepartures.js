import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme, METRO_LINES } from '../theme/theme';
import { useApp } from '../context/AppContext';

const NextDepartures = ({ stationId, stationName }) => {
  const { getNextDepartures } = useApp();
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDepartures = async () => {
    if (!stationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getNextDepartures(stationId);
      if (result.success) {
        setDepartures(result.departures.slice(0, 4));
      } else {
        setError(result.error || 'Erreur de chargement');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartures();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadDepartures, 30 * 1000);
    return () => clearInterval(interval);
  }, [stationId]);

  // Calculer le temps d'attente en minutes
  const getWaitTime = (expectedTime) => {
    if (!expectedTime) return null;
    const now = new Date();
    const arrival = new Date(expectedTime);
    const diffMs = arrival - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 0) return 'Maintenant';
    if (diffMins === 0) return 'Maintenant';
    if (diffMins === 1) return '1 min';
    return `${diffMins} min`;
  };

  // Obtenir la couleur d'une ligne
  const getLineColor = (lineId) => {
    const line = METRO_LINES.find(l => l.id === lineId);
    return line?.color || theme.colors.primary;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="clock-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.title}>Prochains passages</Text>
        </View>
        <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="clock-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.title}>Prochains passages</Text>
          <TouchableOpacity onPress={loadDepartures}>
            <Icon name="refresh" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Horaires indisponibles</Text>
      </View>
    );
  }

  if (departures.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="clock-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.title}>Prochains passages</Text>
        </View>
        <Text style={styles.emptyText}>Aucun passage prévu</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="clock-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.title}>Prochains passages</Text>
        <TouchableOpacity onPress={loadDepartures}>
          <Icon name="refresh" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {departures.map((departure, index) => (
        <View key={index} style={styles.departureRow}>
          <View style={[styles.lineChip, { backgroundColor: getLineColor(departure.lineId) }]}>
            <Text style={styles.lineChipText}>{departure.lineId || '?'}</Text>
          </View>

          <View style={styles.departureInfo}>
            <Text style={styles.destination} numberOfLines={1}>
              {departure.destination || 'Direction inconnue'}
            </Text>
          </View>

          <View style={styles.timeContainer}>
            <Text style={[
              styles.waitTime,
              getWaitTime(departure.expectedTime) === 'Maintenant' && styles.waitTimeNow
            ]}>
              {getWaitTime(departure.expectedTime) || '--'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  loader: {
    marginVertical: theme.spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  departureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lineChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 28,
    alignItems: 'center',
  },
  lineChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  departureInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  destination: {
    fontSize: 14,
    color: theme.colors.text,
  },
  timeContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  waitTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  waitTimeNow: {
    color: theme.colors.success,
  },
});

export default NextDepartures;
