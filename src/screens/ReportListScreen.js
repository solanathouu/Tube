import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { theme } from '../theme/theme';
import { useApp } from '../context/AppContext';
import ReportCard from '../components/ReportCard';
import FilterBar from '../components/FilterBar';
import TrafficStatusBar from '../components/TrafficStatusBar';

const ReportListScreen = ({ navigation }) => {
  const { getFilteredReports, activeFilter, setFilter, voteReport, thankReport } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const filteredReports = getFilteredReports();

  const handleRefresh = () => {
    setRefreshing(true);
    // Simuler un rechargement
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleCardPress = (report) => {
    Alert.alert(
      'Voir sur la carte',
      'Souhaitez-vous voir ce signalement sur la carte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Voir',
          onPress: () => {
            // Naviguer vers la carte (sera géré par le bottom tab navigator)
            navigation.navigate('Map');
          },
        },
      ]
    );
  };

  const handleVote = async (reportId, voteType) => {
    const result = await voteReport(reportId, voteType);
    if (result.success) {
      Alert.alert('Merci !', 'Vote enregistré ! +5 XP');
    } else {
      Alert.alert('Erreur', result.error || 'Impossible de voter');
    }
  };

  const handleThanks = async (reportId, authorUid) => {
    const result = await thankReport(reportId, authorUid);
    if (result.success) {
      Alert.alert('Merci envoyé !', 'L\'auteur a reçu votre remerciement');
    } else if (result.error) {
      Alert.alert('Info', result.error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {filteredReports.length} signalement{filteredReports.length > 1 ? 's' : ''} actif{filteredReports.length > 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Aucun signalement pour le moment</Text>
      <Text style={styles.emptySubtext}>Soyez le premier à signaler !</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TrafficStatusBar />
      <FilterBar activeFilter={activeFilter} onFilterChange={setFilter} />
      <FlatList
        data={filteredReports}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => handleCardPress(item)}
            onVote={handleVote}
            onThanks={handleThanks}
          />
        )}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={filteredReports.length === 0 && styles.emptyList}
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
  emptyList: {
    flexGrow: 1,
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
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default ReportListScreen;
