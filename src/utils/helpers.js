import { XP_LEVELS } from '../theme/theme';

/**
 * Calcule le niveau et les infos XP d'un utilisateur
 */
export const calculateLevel = (xp) => {
  const level = XP_LEVELS.find(l => xp >= l.minXP && xp < l.maxXP) || XP_LEVELS[XP_LEVELS.length - 1];
  return level;
};

/**
 * Formate un timestamp en "Il y a X minutes/heures"
 */
export const formatTimeAgo = (date) => {
  if (!date) return 'Date inconnue';

  const now = new Date();
  // Gérer les Timestamp Firebase
  const dateObj = date?.toDate ? date.toDate() : new Date(date);

  // Vérifier que la date est valide
  if (isNaN(dateObj.getTime())) return 'Date invalide';

  const diff = Math.floor((now - dateObj) / 1000); // en secondes

  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return dateObj.toLocaleDateString('fr-FR');
};

/**
 * Calcule le temps restant avant expiration (en minutes)
 */
export const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;

  const now = new Date();
  const expireDate = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);

  // Vérifier que la date est valide
  if (isNaN(expireDate.getTime())) return 0;

  const diff = Math.ceil((expireDate - now) / 1000 / 60); // en minutes (arrondi au supérieur)
  return Math.max(0, diff);
};

/**
 * Calcule le pourcentage de progression XP dans le niveau actuel
 */
export const calculateXPProgress = (xp) => {
  const level = calculateLevel(xp);
  const progress = ((xp - level.minXP) / (level.maxXP - level.minXP)) * 100;
  return Math.min(100, Math.max(0, progress));
};

/**
 * Génère un ID unique (simpliste pour mock)
 */
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Vérifie si un signalement est encore actif (pas expiré)
 */
export const isReportActive = (report) => {
  return new Date(report.expiresAt) > new Date() && report.status === 'active';
};

/**
 * Calcule le score de confiance d'un signalement basé sur les votes et les niveaux XP
 * @param {Object} report - Le signalement avec votes et author
 * @returns {number} Score de confiance en pourcentage (0-100)
 */
export const calculateConfidenceScore = (report) => {
  if (!report || !report.votes) return 50;

  const presentVotes = Array.isArray(report.votes.present) ? report.votes.present : [];
  const absentVotes = Array.isArray(report.votes.absent) ? report.votes.absent : [];

  // Si ancien format (nombres), convertir
  const totalPresent = typeof report.votes.present === 'number' ? report.votes.present : presentVotes.length;
  const totalAbsent = typeof report.votes.absent === 'number' ? report.votes.absent : absentVotes.length;

  const total = totalPresent + totalAbsent;
  if (total === 0) return 50; // Par défaut 50% si aucun vote

  // Calcul de base : ratio présent/total
  let baseScore = (totalPresent / total) * 100;

  // Bonus pour nombre de votes (plus de votes = plus fiable)
  const voteBonus = Math.min(20, total * 2); // Max +20%

  // Score final
  let finalScore = baseScore + (voteBonus * (baseScore / 100));

  // Vérifier que le score est un nombre valide
  if (isNaN(finalScore)) return 50;

  return Math.min(100, Math.max(0, Math.round(finalScore)));
};
