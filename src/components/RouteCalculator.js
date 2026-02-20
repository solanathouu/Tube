import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme, METRO_LINES } from '../theme/theme';
import { useApp } from '../context/AppContext';

const RouteCalculator = ({ visible, onClose, initialFrom, initialTo }) => {
  const { calculateRoute, searchStops, userLocation, stations } = useApp();
  const [fromText, setFromText] = useState(initialFrom?.name || '');
  const [toText, setToText] = useState(initialTo?.name || '');
  const [fromStation, setFromStation] = useState(initialFrom);
  const [toStation, setToStation] = useState(initialTo);
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [journeys, setJourneys] = useState([]);
  const [error, setError] = useState(null);

  // Rechercher des suggestions d'arrêts
  const handleSearch = async (text, inputType) => {
    if (inputType === 'from') {
      setFromText(text);
      setFromStation(null);
    } else {
      setToText(text);
      setToStation(null);
    }

    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    // Recherche locale d'abord
    const localResults = stations.filter(s =>
      s.name.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 5);

    setSuggestions(localResults.map(s => ({
      id: s.id,
      name: s.name,
      line: s.line,
      coordinates: s.coordinates,
      type: 'local',
    })));

    // Recherche API en parallèle
    try {
      const result = await searchStops(text, userLocation);
      if (result.success && result.places.length > 0) {
        const apiResults = result.places.map(p => ({
          id: p.id,
          name: p.name,
          coordinates: p.coordinates,
          lines: p.lines,
          type: 'api',
        }));
        setSuggestions(prev => [...prev, ...apiResults].slice(0, 8));
      }
    } catch (err) {
      // Ignorer les erreurs API, garder les résultats locaux
    }
  };

  // Sélectionner une suggestion
  const handleSelectSuggestion = (suggestion) => {
    if (activeInput === 'from') {
      setFromText(suggestion.name);
      setFromStation(suggestion);
    } else {
      setToText(suggestion.name);
      setToStation(suggestion);
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  // Utiliser ma position actuelle
  const handleUseMyLocation = () => {
    if (userLocation) {
      setFromText('Ma position');
      setFromStation({
        name: 'Ma position',
        coordinates: userLocation,
        type: 'location',
      });
    }
  };

  // Inverser départ et arrivée
  const handleSwap = () => {
    const tempText = fromText;
    const tempStation = fromStation;
    setFromText(toText);
    setFromStation(toStation);
    setToText(tempText);
    setToStation(tempStation);
  };

  // Calculer le temps d'attente en minutes
  const calculateWaitTime = (departureTimeStr) => {
    if (!departureTimeStr) return null;

    try {
      // Format: YYYYMMDDTHHMMSS
      const year = parseInt(departureTimeStr.substring(0, 4));
      const month = parseInt(departureTimeStr.substring(4, 6)) - 1;
      const day = parseInt(departureTimeStr.substring(6, 8));
      const hour = parseInt(departureTimeStr.substring(9, 11));
      const minute = parseInt(departureTimeStr.substring(11, 13));
      const second = parseInt(departureTimeStr.substring(13, 15));

      const departureDate = new Date(year, month, day, hour, minute, second);
      const now = new Date();
      const diffMs = departureDate - now;
      const diffMinutes = diffMs / (1000 * 60);

      return diffMinutes > 0 ? diffMinutes : 0;
    } catch (error) {
      console.error('Erreur calcul temps d\'attente:', error);
      return null;
    }
  };

  // Calculer l'itinéraire
  const handleCalculate = async () => {
    if (!fromStation?.coordinates || !toStation?.coordinates) {
      setError('Veuillez sélectionner un point de départ et d\'arrivée');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await calculateRoute(
        fromStation.coordinates,
        toStation.coordinates
      );

      if (result.success) {
        // Calculer le temps d'attente pour chaque itinéraire
        const journeysWithWaitTime = result.journeys.map(journey => {
          const waitTime = calculateWaitTime(journey.firstTransitDeparture);
          return {
            ...journey,
            waitTime,
          };
        });

        setJourneys(journeysWithWaitTime);
        if (journeysWithWaitTime.length === 0) {
          setError('Aucun itinéraire trouvé');
        }
      } else {
        setError(result.error || 'Erreur lors du calcul');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Formater la durée
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  // Formater l'heure
  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    // Format YYYYMMDDTHHMMSS
    const time = dateStr.substring(9, 13);
    return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
  };

  // Obtenir la couleur d'une ligne
  const getLineColor = (lineCode) => {
    const line = METRO_LINES.find(l => l.id === lineCode);
    return line?.color || theme.colors.primary;
  };

  // Formater le temps d'attente
  const formatWaitTime = (minutes) => {
    if (minutes === null || minutes === undefined) return null;
    if (minutes < 1) return 'À l\'approche';
    if (minutes === 1) return '1 min d\'attente';
    return `${Math.round(minutes)} min d\'attente`;
  };

  // Rendu d'un itinéraire
  const renderJourney = (journey, index) => (
    <View key={index} style={styles.journeyCard}>
      <View style={styles.journeyHeader}>
        <View style={styles.journeyTime}>
          <Text style={styles.journeyDuration}>{formatDuration(journey.duration)}</Text>
          <Text style={styles.journeyTimes}>
            {formatTime(journey.departureTime)} - {formatTime(journey.arrivalTime)}
          </Text>
          {journey.waitTime !== undefined && journey.waitTime !== null && (
            <Text style={styles.waitTimeText}>
              {formatWaitTime(journey.waitTime)}
            </Text>
          )}
        </View>
        <View style={styles.journeyMeta}>
          {journey.nbTransfers > 0 && (
            <View style={styles.metaItem}>
              <Icon name="swap-horizontal" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{journey.nbTransfers} corresp.</Text>
            </View>
          )}
          {journey.walkingDuration > 60 && (
            <View style={styles.metaItem}>
              <Icon name="walk" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{formatDuration(journey.walkingDuration)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.journeySections}>
        {journey.sections.filter(s => s.type === 'public_transport').map((section, idx) => (
          <View key={idx} style={styles.sectionChip}>
            <View style={[styles.lineChip, { backgroundColor: section.lineColor || getLineColor(section.line) }]}>
              <Text style={styles.lineChipText}>{section.line || '?'}</Text>
            </View>
            <Text style={styles.sectionStops} numberOfLines={1}>
              {section.direction || section.to?.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calculer un itinéraire</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.inputsContainer}>
          <View style={styles.inputRow}>
            <Icon name="circle-outline" size={16} color={theme.colors.success} />
            <TextInput
              style={styles.input}
              placeholder="Départ"
              value={fromText}
              onChangeText={(text) => handleSearch(text, 'from')}
              onFocus={() => setActiveInput('from')}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TouchableOpacity onPress={handleUseMyLocation}>
              <Icon name="crosshairs-gps" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <Icon name="swap-vertical" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <Icon name="map-marker" size={16} color={theme.colors.danger} />
            <TextInput
              style={styles.input}
              placeholder="Arrivée"
              value={toText}
              onChangeText={(text) => handleSearch(text, 'to')}
              onFocus={() => setActiveInput('to')}
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion.id}-${index}`}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(suggestion)}
              >
                <Icon name="subway-variant" size={18} color={theme.colors.textSecondary} />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionName}>{suggestion.name}</Text>
                  {suggestion.line && (
                    <View style={[styles.lineChipSmall, { backgroundColor: getLineColor(suggestion.line) }]}>
                      <Text style={styles.lineChipTextSmall}>{suggestion.line}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.calculateButton, (!fromStation || !toStation) && styles.calculateButtonDisabled]}
          onPress={handleCalculate}
          disabled={!fromStation || !toStation || loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <Icon name="directions" size={20} color={theme.colors.textInverse} />
              <Text style={styles.calculateButtonText}>Calculer</Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView style={styles.resultsContainer}>
          {journeys.map((journey, index) => renderJourney(journey, index))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  inputsContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  input: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
  },
  swapButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: -theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  suggestionName: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  lineChipSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: theme.spacing.sm,
  },
  lineChipTextSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  calculateButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  calculateButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    color: theme.colors.danger,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  journeyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  journeyTime: {
    flex: 1,
  },
  journeyDuration: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  journeyTimes: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  waitTimeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  journeyMeta: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  journeySections: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  sectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  lineChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 26,
    alignItems: 'center',
  },
  lineChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionStops: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    maxWidth: 120,
  },
});

export default RouteCalculator;
