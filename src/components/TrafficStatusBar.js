import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme, METRO_LINES } from '../theme/theme';
import { useApp } from '../context/AppContext';

const TrafficStatusBar = () => {
  const {
    officialDisruptions,
    networkStatus,
    loadingDisruptions,
    refreshDisruptions
  } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDisruption, setSelectedDisruption] = useState(null);

  // Compter les lignes perturbées
  const disruptedLines = Object.entries(networkStatus)
    .filter(([_, status]) => status.status !== 'ok')
    .map(([lineId]) => lineId);

  // Obtenir la couleur d'une ligne
  const getLineColor = (lineId) => {
    const line = METRO_LINES.find(l => l.id === lineId);
    return line?.color || theme.colors.primary;
  };

  // Obtenir le statut global du réseau
  const getOverallStatus = () => {
    if (loadingDisruptions) return 'loading';
    if (disruptedLines.length === 0) return 'ok';

    const hasInterrupted = Object.values(networkStatus).some(s => s.status === 'interrupted');
    if (hasInterrupted) return 'critical';

    return 'disrupted';
  };

  const status = getOverallStatus();

  const statusConfig = {
    loading: { icon: 'loading', color: theme.colors.textSecondary, text: 'Chargement...' },
    ok: { icon: 'check-circle', color: theme.colors.success, text: 'Trafic normal' },
    disrupted: { icon: 'alert-circle', color: theme.colors.warning, text: `${disruptedLines.length} ligne${disruptedLines.length > 1 ? 's' : ''} perturbée${disruptedLines.length > 1 ? 's' : ''}` },
    critical: { icon: 'alert-octagon', color: theme.colors.danger, text: 'Perturbations majeures' },
  };

  const config = statusConfig[status];

  const handleDisruptionPress = (disruption) => {
    setSelectedDisruption(disruption);
    setModalVisible(true);
  };

  const renderLineChip = (lineId) => (
    <View
      key={lineId}
      style={[styles.lineChip, { backgroundColor: getLineColor(lineId) }]}
    >
      <Text style={styles.lineChipText}>{lineId}</Text>
    </View>
  );

  const renderDisruptionModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Icon name="information" size={24} color={theme.colors.primary} />
            <Text style={styles.modalTitle}>Info Trafic RATP</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {selectedDisruption ? (
            <ScrollView style={styles.modalBody}>
              <View style={styles.disruptionDetail}>
                <Text style={styles.disruptionTitle}>{selectedDisruption.title}</Text>

                {selectedDisruption.lines?.length > 0 && (
                  <View style={styles.linesRow}>
                    {selectedDisruption.lines.map(line => line && renderLineChip(line))}
                  </View>
                )}

                <Text style={styles.disruptionMessage}>{selectedDisruption.message}</Text>

                {selectedDisruption.startTime && (
                  <Text style={styles.disruptionTime}>
                    Depuis: {new Date(selectedDisruption.startTime).toLocaleString('fr-FR')}
                  </Text>
                )}
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.modalBody}>
              {officialDisruptions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="check-circle" size={48} color={theme.colors.success} />
                  <Text style={styles.emptyText}>Aucune perturbation en cours</Text>
                </View>
              ) : (
                officialDisruptions.map((disruption, index) => (
                  <TouchableOpacity
                    key={disruption.id || index}
                    style={styles.disruptionItem}
                    onPress={() => setSelectedDisruption(disruption)}
                  >
                    <Icon
                      name={disruption.type === 'maintenance' ? 'alert-octagon' : 'alert-circle'}
                      size={20}
                      color={disruption.type === 'maintenance' ? theme.colors.danger : theme.colors.warning}
                    />
                    <View style={styles.disruptionItemContent}>
                      <Text style={styles.disruptionItemTitle} numberOfLines={1}>
                        {disruption.title}
                      </Text>
                      {disruption.lines?.length > 0 && (
                        <View style={styles.linesRowSmall}>
                          {disruption.lines.slice(0, 5).map(line => line && (
                            <View
                              key={line}
                              style={[styles.lineChipSmall, { backgroundColor: getLineColor(line) }]}
                            >
                              <Text style={styles.lineChipTextSmall}>{line}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              refreshDisruptions();
              setSelectedDisruption(null);
            }}
          >
            <Icon name="refresh" size={20} color={theme.colors.textInverse} />
            <Text style={styles.refreshButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { borderLeftColor: config.color }]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.statusSection}>
          {status === 'loading' ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <Icon name={config.icon} size={20} color={config.color} />
          )}
          <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
        </View>

        {disruptedLines.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.linesScroll}
          >
            {disruptedLines.slice(0, 6).map(lineId => renderLineChip(lineId))}
            {disruptedLines.length > 6 && (
              <View style={[styles.lineChip, { backgroundColor: theme.colors.textSecondary }]}>
                <Text style={styles.lineChipText}>+{disruptedLines.length - 6}</Text>
              </View>
            )}
          </ScrollView>
        )}

        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {renderDisruptionModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderLeftWidth: 4,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  linesScroll: {
    maxWidth: 150,
    marginHorizontal: theme.spacing.sm,
  },
  lineChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  lineChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lineChipSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginRight: 3,
    minWidth: 20,
    alignItems: 'center',
  },
  lineChipTextSmall: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  modalBody: {
    padding: theme.spacing.md,
    maxHeight: 400,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  disruptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  disruptionItemContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  disruptionItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  linesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  linesRowSmall: {
    flexDirection: 'row',
    marginTop: 4,
  },
  disruptionDetail: {
    padding: theme.spacing.sm,
  },
  disruptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  disruptionMessage: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    lineHeight: 20,
  },
  disruptionTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  refreshButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});

export default TrafficStatusBar;
