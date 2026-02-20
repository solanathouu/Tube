import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { METRO_LINES } from '../theme/theme';

const FavoriteLinesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, toggleFavoriteLine } = useApp();

  const styles = useMemo(() => getStyles(theme), [theme]);

  const favoriteLines = user?.preferences?.favoriteLines || [];

  const handleToggleLine = async (lineId) => {
    await toggleFavoriteLine(lineId);
  };

  const isLineFavorite = (lineId) => {
    return favoriteLines.includes(lineId);
  };

  // Séparer les lignes de métro et RER
  const metroLines = METRO_LINES.filter(line => !isNaN(line.id));
  const rerLines = METRO_LINES.filter(line => isNaN(line.id));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lignes favorites</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container}>

      {/* Info */}
      <View style={styles.infoBox}>
        <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          Sélectionnez vos lignes favorites pour recevoir des notifications en cas de signalement.
        </Text>
      </View>

      {/* Lignes sélectionnées */}
      {favoriteLines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mes lignes ({favoriteLines.length})
          </Text>
          <View style={styles.selectedLinesContainer}>
            {favoriteLines.map(lineId => {
              const line = METRO_LINES.find(l => l.id === lineId);
              if (!line) return null;
              return (
                <TouchableOpacity
                  key={line.id}
                  style={[styles.selectedChip, { backgroundColor: line.color }]}
                  onPress={() => handleToggleLine(line.id)}
                >
                  <Text style={styles.selectedChipText}>
                    {line.id.length === 1 && !isNaN(line.id) ? `M${line.id}` : line.id}
                  </Text>
                  <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Lignes de métro */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Métro</Text>
        <View style={styles.linesGrid}>
          {metroLines.map(line => {
            const isFavorite = isLineFavorite(line.id);
            return (
              <TouchableOpacity
                key={line.id}
                style={[
                  styles.lineCard,
                  isFavorite && styles.lineCardSelected,
                  { borderColor: line.color },
                ]}
                onPress={() => handleToggleLine(line.id)}
              >
                <View style={[styles.lineIcon, { backgroundColor: line.color }]}>
                  <Text style={styles.lineIconText}>{line.id}</Text>
                </View>
                <Text style={styles.lineName}>{line.name}</Text>
                {isFavorite && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* RER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RER</Text>
        <View style={styles.linesGrid}>
          {rerLines.map(line => {
            const isFavorite = isLineFavorite(line.id);
            return (
              <TouchableOpacity
                key={line.id}
                style={[
                  styles.lineCard,
                  isFavorite && styles.lineCardSelected,
                  { borderColor: line.color },
                ]}
                onPress={() => handleToggleLine(line.id)}
              >
                <View style={[styles.lineIcon, { backgroundColor: line.color }]}>
                  <Text style={styles.lineIconText}>{line.id}</Text>
                </View>
                <Text style={styles.lineName}>{line.name}</Text>
                {isFavorite && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.colors.success}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    placeholder: {
      width: 40,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      alignItems: 'flex-start',
    },
    infoText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    section: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    selectedLinesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    selectedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.round,
      gap: theme.spacing.xs,
    },
    selectedChipText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    linesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    lineCard: {
      width: '31%',
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
    },
    lineCardSelected: {
      backgroundColor: theme.colors.surface,
    },
    lineIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    lineIconText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 18,
    },
    lineName: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    checkIcon: {
      position: 'absolute',
      top: 4,
      right: 4,
    },
    bottomSpacer: {
      height: 100,
    },
  });

export default FavoriteLinesScreen;
