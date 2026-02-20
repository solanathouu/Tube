import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, REPORT_TYPES } from '../theme/theme';
import { formatTimeAgo } from '../utils/helpers';
import { useApp } from '../context/AppContext';

const ReportDetailModal = ({ visible, report, onClose }) => {
  const { voteReport, thankReport, user } = useApp();

  if (!report) return null;

  const reportType = Object.values(REPORT_TYPES).find(t => t.id === report.type);

  // Gérer les votes (format array)
  const presentCount = Array.isArray(report.votes?.present)
    ? report.votes.present.length
    : 0;
  const absentCount = Array.isArray(report.votes?.absent)
    ? report.votes.absent.length
    : 0;

  // Vérifier si l'utilisateur a déjà voté
  const hasVotedPresent = report.votes?.present?.includes(user?.uid);
  const hasVotedAbsent = report.votes?.absent?.includes(user?.uid);
  const hasVoted = hasVotedPresent || hasVotedAbsent;

  // Vérifier si l'utilisateur a déjà remercié
  const hasThanked = report.thanks?.includes(user?.uid);
  const thanksCount = report.thanks?.length || 0;

  const handleVote = async (voteType) => {
    if (hasVoted) {
      alert('Vous avez déjà voté sur ce signalement');
      return;
    }

    const result = await voteReport(report.id, voteType);
    if (result.success) {
      alert('Vote enregistré ! +5 XP');
    } else {
      alert(result.error || 'Impossible de voter');
    }
  };

  const handleThank = async () => {
    if (hasThanked) {
      alert('Vous avez déjà remercié ce signalement');
      return;
    }

    if (report.authorId === user?.uid) {
      alert('Vous ne pouvez pas remercier votre propre signalement');
      return;
    }

    const result = await thankReport(report.id, report.authorId);
    if (result.success) {
      alert('Merci envoyé ! 🙏');
    } else {
      alert(result.error || 'Impossible d\'envoyer le merci');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: reportType?.color || theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name={reportType?.icon || 'alert'}
                size={24}
                color={theme.colors.surface}
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>{reportType?.label || 'Signalement'}</Text>
              <Text style={styles.headerSubtitle}>
                Ligne {report.line} • {report.stationName}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Informations */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{formatTimeAgo(report.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>
                Par {report.author?.username} (Niv. {report.author?.level || 1})
              </Text>
            </View>
          </View>

          {/* Commentaire */}
          {report.comment && (
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Détails</Text>
              <Text style={styles.commentText}>"{report.comment}"</Text>
            </View>
          )}

          {/* Votes */}
          <View style={styles.votesSection}>
            <Text style={styles.sectionTitle}>Confirmations</Text>
            <View style={styles.votesGrid}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  hasVotedPresent && styles.voteButtonActive,
                  hasVoted && !hasVotedPresent && styles.voteButtonDisabled,
                ]}
                onPress={() => handleVote('present')}
                disabled={hasVoted}
              >
                <MaterialCommunityIcons
                  name="thumb-up"
                  size={24}
                  color={hasVotedPresent ? theme.colors.success : theme.colors.text}
                />
                <Text
                  style={[
                    styles.voteButtonText,
                    hasVotedPresent && { color: theme.colors.success },
                  ]}
                >
                  {presentCount} Là
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  hasVotedAbsent && styles.voteButtonActive,
                  hasVoted && !hasVotedAbsent && styles.voteButtonDisabled,
                ]}
                onPress={() => handleVote('absent')}
                disabled={hasVoted}
              >
                <MaterialCommunityIcons
                  name="thumb-down"
                  size={24}
                  color={hasVotedAbsent ? theme.colors.danger : theme.colors.text}
                />
                <Text
                  style={[
                    styles.voteButtonText,
                    hasVotedAbsent && { color: theme.colors.danger },
                  ]}
                >
                  {absentCount} Pas là
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton Merci */}
          {report.authorId !== user?.uid && (
            <TouchableOpacity
              style={[
                styles.thankButton,
                hasThanked && styles.thankButtonDisabled,
              ]}
              onPress={handleThank}
              disabled={hasThanked}
            >
              <MaterialCommunityIcons
                name={hasThanked ? 'check-circle' : 'hand-heart'}
                size={20}
                color={hasThanked ? theme.colors.success : theme.colors.primary}
              />
              <Text
                style={[
                  styles.thankButtonText,
                  hasThanked && { color: theme.colors.success },
                ]}
              >
                {hasThanked ? 'Merci envoyé' : `Remercier (${thanksCount})`}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.md,
  },
  infoSection: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  commentSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  votesSection: {
    marginBottom: theme.spacing.md,
  },
  votesGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  voteButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  thankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  thankButtonDisabled: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success + '10',
  },
  thankButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

export default ReportDetailModal;
