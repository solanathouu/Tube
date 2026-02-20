import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../theme/theme';
import { findNearestStation, calculateRoute } from '../utils/routeCalculator';

const SearchModal = ({ visible, onClose, userLocation, stations }) => {
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);

  const handleSearch = async () => {
    if (!destination.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse de destination');
      return;
    }

    if (!userLocation) {
      Alert.alert('Erreur', 'Position actuelle non disponible');
      return;
    }

    setLoading(true);

    try {
      // Geocoder l'adresse de destination
      const geocoded = await Location.geocodeAsync(destination + ', Paris, France');

      if (geocoded.length === 0) {
        Alert.alert('Erreur', 'Adresse non trouvée. Essayez avec une adresse plus précise.');
        setLoading(false);
        return;
      }

      const destCoords = geocoded[0];

      // Trouver la station la plus proche de la position actuelle
      const nearestFromStation = findNearestStation(
        userLocation.latitude,
        userLocation.longitude,
        stations
      );

      // Trouver la station la plus proche de la destination
      const nearestToStation = findNearestStation(
        destCoords.latitude,
        destCoords.longitude,
        stations
      );

      // Calculer l'itinéraire
      const calculatedRoute = calculateRoute(
        nearestFromStation,
        nearestToStation,
        stations
      );

      // Ajouter les infos de distance à pied
      setRoute({
        ...calculatedRoute,
        walkToStation: Math.round(nearestFromStation.distance * 1000), // en mètres
        walkFromStation: Math.round(nearestToStation.distance * 1000), // en mètres
        fromStation: nearestFromStation,
        toStation: nearestToStation
      });

      setLoading(false);
    } catch (error) {
      console.error('Erreur recherche:', error);
      Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins}`;
    }
    return `${mins} min`;
  };

  const resetSearch = () => {
    setDestination('');
    setRoute(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Itinéraire</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Champ de recherche */}
            <View style={styles.searchSection}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.primary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Où allez-vous ?"
                placeholderTextColor={theme.colors.textSecondary}
                value={destination}
                onChangeText={setDestination}
                autoCapitalize="words"
              />
              {destination.length > 0 && (
                <TouchableOpacity onPress={resetSearch}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <>
                  <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.surface} />
                  <Text style={styles.searchButtonText}>Rechercher</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Affichage de l'itinéraire */}
            {route && (
              <View style={styles.routeContainer}>
                <View style={styles.routeHeader}>
                  <MaterialCommunityIcons name="subway-variant" size={32} color={theme.colors.primary} />
                  <View style={styles.routeSummary}>
                    <Text style={styles.routeDuration}>{formatDuration(route.estimatedTime + 10)}</Text>
                    <Text style={styles.routeSubtitle}>
                      {route.transfers === 0 ? 'Direct' : `${route.transfers} correspondance${route.transfers > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                </View>

                {/* Marche jusqu'à la station */}
                <View style={styles.step}>
                  <View style={styles.stepIcon}>
                    <MaterialCommunityIcons name="walk" size={20} color={theme.colors.textSecondary} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Marcher jusqu'à {route.fromStation.name}</Text>
                    <Text style={styles.stepSubtitle}>{route.walkToStation}m • ~{Math.ceil(route.walkToStation / 80)} min</Text>
                  </View>
                </View>

                {/* Étapes en métro */}
                {route.steps.map((step, index) => (
                  <View key={index} style={styles.step}>
                    <View style={[styles.stepIcon, { backgroundColor: `#${step.line === '1' ? 'FFCD00' : step.line === '2' ? '003CA6' : step.line === '3' ? '837902' : step.line === '4' ? 'BE418D' : step.line === '5' ? 'FF7E2E' : step.line === '6' ? '6ECA97' : step.line === '7' ? 'FA9ABA' : step.line === '8' ? 'E19BDF' : step.line === '9' ? 'B6BD00' : step.line === '10' ? 'C9910D' : step.line === '11' ? '704B1C' : step.line === '12' ? '007852' : step.line === '13' ? '6EC4E8' : step.line === '14' ? '62259D' : 'A0006E'}` }]}>
                      <Text style={styles.lineNumber}>{step.line}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Ligne {step.line}</Text>
                      <Text style={styles.stepSubtitle}>
                        De {step.from} à {step.to}
                      </Text>
                      <Text style={styles.stepSubtitle}>{step.stations} station{step.stations > 1 ? 's' : ''} • {step.stations * 2} min</Text>
                    </View>
                  </View>
                ))}

                {/* Marche depuis la station */}
                <View style={styles.step}>
                  <View style={styles.stepIcon}>
                    <MaterialCommunityIcons name="walk" size={20} color={theme.colors.textSecondary} />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Marcher jusqu'à destination</Text>
                    <Text style={styles.stepSubtitle}>{route.walkFromStation}m • ~{Math.ceil(route.walkFromStation / 80)} min</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.md,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    padding: 0,
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  routeContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  routeSummary: {
    marginLeft: theme.spacing.md,
  },
  routeDuration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  routeSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.md,
  },
  lineNumber: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});

export default SearchModal;
