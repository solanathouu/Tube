import React, { useState, useMemo } from 'react';
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

const FavoriteRoutesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, stations, updateFavoriteRoutes } = useApp();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [routes, setRoutes] = useState(user?.preferences?.favoriteRoutes || []);
  const [editingRoute, setEditingRoute] = useState(null);
  const [newRoute, setNewRoute] = useState({
    name: '',
    fromStation: null,
    toStation: null,
    line: null,
    notifyAlerts: true,
  });

  // Stations filtrées par ligne
  const getStationsForLine = (lineId) => {
    return stations.filter(s => s.line === lineId);
  };

  const handleAddRoute = () => {
    setEditingRoute('new');
    setNewRoute({
      name: '',
      fromStation: null,
      toStation: null,
      line: null,
      notifyAlerts: true,
    });
  };

  const handleSaveRoute = async () => {
    if (!newRoute.fromStation || !newRoute.toStation) {
      Alert.alert('Erreur', 'Veuillez sélectionner les stations de départ et d\'arrivée');
      return;
    }

    const routeToSave = {
      id: editingRoute === 'new' ? Date.now().toString() : editingRoute,
      name: newRoute.name || `${newRoute.fromStation.name} → ${newRoute.toStation.name}`,
      fromStation: {
        id: newRoute.fromStation.id,
        name: newRoute.fromStation.name,
        line: newRoute.fromStation.line,
      },
      toStation: {
        id: newRoute.toStation.id,
        name: newRoute.toStation.name,
        line: newRoute.toStation.line,
      },
      notifyAlerts: newRoute.notifyAlerts,
    };

    let updatedRoutes;
    if (editingRoute === 'new') {
      updatedRoutes = [...routes, routeToSave];
    } else {
      updatedRoutes = routes.map(r => r.id === editingRoute ? routeToSave : r);
    }

    setRoutes(updatedRoutes);
    await updateFavoriteRoutes?.(updatedRoutes);
    setEditingRoute(null);
  };

  const handleDeleteRoute = (routeId) => {
    Alert.alert(
      'Supprimer le trajet',
      'Êtes-vous sûr de vouloir supprimer ce trajet favori ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedRoutes = routes.filter(r => r.id !== routeId);
            setRoutes(updatedRoutes);
            await updateFavoriteRoutes?.(updatedRoutes);
          },
        },
      ]
    );
  };

  const renderRouteEditor = () => (
    <View style={styles.editorContainer}>
      <Text style={styles.editorTitle}>
        {editingRoute === 'new' ? 'Nouveau trajet' : 'Modifier le trajet'}
      </Text>

      {/* Sélection de la ligne */}
      <Text style={styles.fieldLabel}>Ligne</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.lineScroll}
      >
        {METRO_LINES.map(line => (
          <TouchableOpacity
            key={line.id}
            style={[
              styles.lineChip,
              { borderColor: line.color },
              newRoute.line === line.id && { backgroundColor: line.color },
            ]}
            onPress={() => setNewRoute(prev => ({
              ...prev,
              line: line.id,
              fromStation: null,
              toStation: null,
            }))}
          >
            <Text style={[
              styles.lineChipText,
              newRoute.line === line.id && { color: '#FFFFFF' },
            ]}>
              {line.id}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stations */}
      {newRoute.line && (
        <>
          <Text style={styles.fieldLabel}>Station de départ</Text>
          <ScrollView style={styles.stationList} nestedScrollEnabled>
            {getStationsForLine(newRoute.line).map(station => (
              <TouchableOpacity
                key={`from-${station.id}`}
                style={[
                  styles.stationItem,
                  newRoute.fromStation?.id === station.id && styles.stationItemSelected,
                ]}
                onPress={() => setNewRoute(prev => ({ ...prev, fromStation: station }))}
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={newRoute.fromStation?.id === station.id ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.stationName,
                  newRoute.fromStation?.id === station.id && styles.stationNameSelected,
                ]}>
                  {station.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Station d'arrivée</Text>
          <ScrollView style={styles.stationList} nestedScrollEnabled>
            {getStationsForLine(newRoute.line).map(station => (
              <TouchableOpacity
                key={`to-${station.id}`}
                style={[
                  styles.stationItem,
                  newRoute.toStation?.id === station.id && styles.stationItemSelected,
                ]}
                onPress={() => setNewRoute(prev => ({ ...prev, toStation: station }))}
              >
                <MaterialCommunityIcons
                  name="map-marker-check"
                  size={20}
                  color={newRoute.toStation?.id === station.id ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.stationName,
                  newRoute.toStation?.id === station.id && styles.stationNameSelected,
                ]}>
                  {station.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Toggle notifications */}
      <TouchableOpacity
        style={styles.notifyToggle}
        onPress={() => setNewRoute(prev => ({ ...prev, notifyAlerts: !prev.notifyAlerts }))}
      >
        <MaterialCommunityIcons
          name={newRoute.notifyAlerts ? 'bell' : 'bell-off'}
          size={24}
          color={newRoute.notifyAlerts ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text style={styles.notifyToggleText}>
          Recevoir les alertes sur ce trajet
        </Text>
        <MaterialCommunityIcons
          name={newRoute.notifyAlerts ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={newRoute.notifyAlerts ? theme.colors.primary : theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Boutons */}
      <View style={styles.editorButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setEditingRoute(null)}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!newRoute.fromStation || !newRoute.toStation) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveRoute}
          disabled={!newRoute.fromStation || !newRoute.toStation}
        >
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
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
          <Text style={styles.headerTitle}>Trajets favoris</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddRoute}
          >
            <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Info */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Ajoutez vos trajets quotidiens (domicile-travail) pour recevoir des alertes automatiques sur ces itinéraires.
            </Text>
          </View>

          {/* Liste des trajets */}
          {routes.length === 0 && !editingRoute ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="routes" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>Aucun trajet favori</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez votre trajet domicile-travail pour être alerté des incidents
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddRoute}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Ajouter un trajet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {routes.map(route => (
                <View key={route.id} style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <MaterialCommunityIcons name="routes" size={24} color={theme.colors.primary} />
                    <Text style={styles.routeName}>{route.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteRoute(route.id)}>
                      <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.routeDetails}>
                    <View style={styles.routeStation}>
                      <MaterialCommunityIcons name="map-marker" size={18} color={theme.colors.success} />
                      <Text style={styles.routeStationText}>{route.fromStation.name}</Text>
                    </View>
                    <MaterialCommunityIcons name="arrow-down" size={16} color={theme.colors.textSecondary} />
                    <View style={styles.routeStation}>
                      <MaterialCommunityIcons name="map-marker-check" size={18} color={theme.colors.danger} />
                      <Text style={styles.routeStationText}>{route.toStation.name}</Text>
                    </View>
                  </View>
                  <View style={styles.routeNotify}>
                    <MaterialCommunityIcons
                      name={route.notifyAlerts ? 'bell' : 'bell-off'}
                      size={16}
                      color={route.notifyAlerts ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text style={[
                      styles.routeNotifyText,
                      !route.notifyAlerts && { color: theme.colors.textSecondary }
                    ]}>
                      {route.notifyAlerts ? 'Alertes activées' : 'Alertes désactivées'}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Éditeur */}
          {editingRoute && renderRouteEditor()}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    addButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primary + '15',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.text,
      lineHeight: 18,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl * 2,
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
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.round,
      marginTop: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    emptyButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    routeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    routeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    routeName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    routeDetails: {
      paddingLeft: theme.spacing.xl + theme.spacing.sm,
      gap: 4,
    },
    routeStation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    routeStationText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    routeNotify: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    routeNotifyText: {
      fontSize: 12,
      color: theme.colors.primary,
    },
    editorContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    editorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    lineScroll: {
      marginBottom: theme.spacing.sm,
    },
    lineChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.round,
      borderWidth: 2,
      marginRight: theme.spacing.sm,
      minWidth: 50,
      alignItems: 'center',
    },
    lineChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    stationList: {
      maxHeight: 150,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
    },
    stationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      gap: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    stationItemSelected: {
      backgroundColor: theme.colors.primary + '15',
    },
    stationName: {
      fontSize: 14,
      color: theme.colors.text,
    },
    stationNameSelected: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    notifyToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.md,
      gap: theme.spacing.md,
    },
    notifyToggleText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
    },
    editorButtons: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    cancelButton: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    saveButton: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    bottomSpacer: {
      height: 100,
    },
  });

export default FavoriteRoutesScreen;
