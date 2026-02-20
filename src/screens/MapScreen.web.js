import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { useApp } from '../context/AppContext';
import ReportModal from '../components/ReportModal';
import FilterBar from '../components/FilterBar';
import ReportCard from '../components/ReportCard';

const MapScreen = () => {
  const { getFilteredReports, activeFilter, setFilter, voteReport } = useApp();
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const filteredReports = getFilteredReports();

  const handleReportSuccess = () => {
    Alert.alert('Succès', 'Signalement créé ! +10 XP', [{ text: 'OK' }]);
  };

  const handleVote = (reportId, voteType) => {
    voteReport(reportId, voteType);
    Alert.alert('Merci !', 'Vote enregistré ! +5 XP');
  };

  return (
    <View style={styles.container}>
      {/* Header Web */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Carte des signalements</Text>
        <Text style={styles.headerSubtitle}>
          Version web - La carte interactive nécessite l'app mobile
        </Text>
      </View>

      {/* Barre de filtres */}
      {showFilters && (
        <View style={styles.filterBarContainer}>
          <FilterBar activeFilter={activeFilter} onFilterChange={setFilter} />
        </View>
      )}

      {/* Message info */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information" size={24} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          La carte interactive avec Google Maps est disponible sur l'application mobile (iOS/Android).
          {'\n'}Scannez le QR code avec Expo Go pour accéder à toutes les fonctionnalités.
        </Text>
      </View>

      {/* Liste des signalements */}
      <ScrollView style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {filteredReports.length} signalement{filteredReports.length > 1 ? 's' : ''} actif{filteredReports.length > 1 ? 's' : ''}
          </Text>
        </View>

        {filteredReports.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            onPress={() => {}}
            onVote={handleVote}
          />
        ))}
      </ScrollView>

      {/* Bouton FAB Signaler */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setIsReportModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={32} color={theme.colors.surface} />
      </TouchableOpacity>

      {/* Modal de signalement */}
      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSuccess={handleReportSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.surface,
    opacity: 0.9,
  },
  filterBarContainer: {
    backgroundColor: theme.colors.surface,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '15',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    gap: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fabButton: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default MapScreen;
