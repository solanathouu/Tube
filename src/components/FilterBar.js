import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { theme, REPORT_TYPES } from '../theme/theme';

const FilterBar = ({ activeFilter, onFilterChange }) => {
  const scrollRef = useRef(null);

  const filters = [
    { id: 'all', label: 'Tous', color: theme.colors.text },
    { id: 'controller', label: 'Personnel RATP', color: REPORT_TYPES.CONTROLLER.color },
    { id: 'incident', label: 'Incidents', color: REPORT_TYPES.INCIDENT.color },
    { id: 'maintenance', label: 'Pannes', color: REPORT_TYPES.MAINTENANCE.color },
    { id: 'works', label: 'Travaux', color: REPORT_TYPES.WORKS.color },
  ];

  const handleFilterPress = (filterId, index) => {
    onFilterChange(filterId);

    // Calculer la position approximative et scroller
    // Chaque chip fait environ 100px de large + 12px de gap
    const chipWidth = 110;
    const scrollPosition = index * chipWidth - 20;

    scrollRef.current?.scrollTo({
      x: Math.max(0, scrollPosition),
      animated: true
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter, index) => {
          const isActive = activeFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.chip,
                isActive && { backgroundColor: filter.color, borderColor: filter.color },
              ]}
              onPress={() => handleFilterPress(filter.id, index)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  chipTextActive: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
});

export default FilterBar;
