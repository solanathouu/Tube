import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, REPORT_TYPES, METRO_LINES } from '../theme/theme';
import { useApp } from '../context/AppContext';

// Suggestions de commentaires par type
const COMMENT_SUGGESTIONS = {
  controller: ['Sur le quai', 'Dans la rame', 'À la sortie', 'Dans les couloirs'],
  incident: ['Sur le quai', 'Dans la rame', 'Dans les couloirs', 'À la sortie', 'Urgent'],
  maintenance: ['Escalator HS', 'Ascenseur en panne', 'Portiques HS', 'Distributeur HS', 'Rame immobilisée'],
  works: ['Fermeture partielle', 'Sortie fermée', 'Correspondance fermée', 'Accès PMR fermé'],
};

// Options de durée pour les travaux (en minutes)
const DURATION_OPTIONS = [
  { label: '1 heure', value: 60 },
  { label: '3 heures', value: 180 },
  { label: '1 jour', value: 1440 },
  { label: '1 semaine', value: 10080 },
  { label: 'Indéterminée', value: 43200 }, // 30 jours
];

const ReportModal = ({ visible, onClose, onSuccess }) => {
  const { createReport, stations } = useApp();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [comment, setComment] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(null); // Pour les travaux

  const reportTypes = Object.values(REPORT_TYPES);

  // Filtrer les stations par ligne sélectionnée
  const filteredStations = selectedLine
    ? stations.filter(s => s.line === selectedLine)
    : [];

  const handleSubmit = async () => {
    if (!selectedType || !selectedStation) {
      alert('Veuillez sélectionner un type et une station');
      return;
    }

    // Pour les travaux, vérifier qu'une durée est sélectionnée
    if (selectedType === 'works' && !selectedDuration) {
      alert('Veuillez sélectionner une durée pour les travaux');
      return;
    }

    const reportData = {
      type: selectedType,
      stationId: selectedStation.id,
      stationName: selectedStation.name,
      line: selectedStation.line,
      coordinates: selectedStation.coordinates,
      comment: comment.trim(),
      // Durée personnalisée pour travaux, sinon 10 min par défaut
      duration: selectedType === 'works' ? selectedDuration : 10,
    };

    const result = await createReport(reportData);

    if (result.success) {
      onSuccess?.();
      resetForm();
      onClose();
    } else {
      alert(result.error || 'Erreur lors de la création du signalement');
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setSelectedLine(null);
    setSelectedStation(null);
    setComment('');
    setSelectedDuration(null);
  };

  // Ajouter une suggestion au commentaire
  const addSuggestion = (suggestion) => {
    const separator = comment.trim() ? ' - ' : '';
    setComment(prev => prev + separator + suggestion);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nouveau signalement</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Sélection du type */}
            <Text style={styles.sectionTitle}>Type de signalement</Text>
            <View style={styles.typeGrid}>
              {reportTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && {
                      backgroundColor: type.color + '20',
                      borderColor: type.color,
                    },
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={32}
                    color={selectedType === type.id ? type.color : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      selectedType === type.id && { color: type.color, fontWeight: '600' },
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sélection de la ligne */}
            <Text style={styles.sectionTitle}>Ligne</Text>
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
                    selectedLine === line.id && { backgroundColor: line.color },
                  ]}
                  onPress={() => {
                    setSelectedLine(line.id);
                    setSelectedStation(null); // Reset station
                  }}
                >
                  <Text
                    style={[
                      styles.lineChipText,
                      selectedLine === line.id && { color: theme.colors.surface },
                    ]}
                  >
                    {line.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sélection de la station */}
            {selectedLine && (
              <>
                <Text style={styles.sectionTitle}>Station</Text>
                <View style={styles.stationList}>
                  {filteredStations.map(station => (
                    <TouchableOpacity
                      key={station.id}
                      style={[
                        styles.stationItem,
                        selectedStation?.id === station.id && styles.stationItemSelected,
                      ]}
                      onPress={() => setSelectedStation(station)}
                    >
                      <Text
                        style={[
                          styles.stationName,
                          selectedStation?.id === station.id && styles.stationNameSelected,
                        ]}
                      >
                        {station.name}
                      </Text>
                      {selectedStation?.id === station.id && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={theme.colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Durée pour les travaux */}
            {selectedType === 'works' && (
              <>
                <Text style={styles.sectionTitle}>Durée estimée</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.durationScroll}
                >
                  {DURATION_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.durationChip,
                        selectedDuration === option.value && styles.durationChipSelected,
                      ]}
                      onPress={() => setSelectedDuration(option.value)}
                    >
                      <Text
                        style={[
                          styles.durationChipText,
                          selectedDuration === option.value && styles.durationChipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Commentaire avec suggestions */}
            <Text style={styles.sectionTitle}>Détails (optionnel)</Text>

            {/* Suggestions rapides */}
            {selectedType && COMMENT_SUGGESTIONS[selectedType] && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestionsScroll}
              >
                {COMMENT_SUGGESTIONS[selectedType].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => addSuggestion(suggestion)}
                  >
                    <Text style={styles.suggestionChipText}>{suggestion}</Text>
                    <MaterialCommunityIcons name="plus" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Ex: Direction Nation, voiture 3..."
              placeholderTextColor={theme.colors.textSecondary}
              value={comment}
              onChangeText={setComment}
              maxLength={200}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.charCount}>{comment.length}/200</Text>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedType || !selectedStation) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedType || !selectedStation}
            >
              <Text style={styles.submitButtonText}>Signaler (+10 XP)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '90%',
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
    paddingBottom: theme.spacing.xl * 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  typeButton: {
    width: '48%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  typeDescription: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  lineScroll: {
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.md,
  },
  stationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  stationItemSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  stationName: {
    fontSize: 14,
    color: theme.colors.text,
  },
  stationNameSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  commentInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  durationScroll: {
    marginBottom: theme.spacing.md,
  },
  durationChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  durationChipSelected: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  durationChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  suggestionsScroll: {
    marginBottom: theme.spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
    gap: 4,
  },
  suggestionChipText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportModal;
