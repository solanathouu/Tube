// Couleurs communes aux deux thèmes
const commonColors = {
  primary: '#2196F3',      // Bleu métro
  secondary: '#FF9800',    // Orange alerte
  success: '#4CAF50',      // Vert validation
  danger: '#F44336',       // Rouge incident
  warning: '#FFC107',      // Jaune attention
};

// Thème clair
export const lightTheme = {
  dark: false,
  colors: {
    ...commonColors,
    background: '#F5F5F5',   // Gris clair
    surface: '#FFFFFF',      // Blanc
    card: '#FFFFFF',         // Carte
    text: '#212121',         // Noir texte
    textSecondary: '#757575',// Gris texte
    textInverse: '#FFFFFF',  // Texte inversé
    disabled: '#BDBDBD',     // Gris disabled
    border: '#E0E0E0',       // Gris bordures
    shadow: '#000000',       // Ombre
    overlay: 'rgba(0,0,0,0.5)', // Overlay modal
    inputBackground: '#FFFFFF',
    statusBar: 'dark-content',
  },
};

// Thème sombre
export const darkTheme = {
  dark: true,
  colors: {
    ...commonColors,
    background: '#121212',   // Fond sombre
    surface: '#1E1E1E',      // Surface sombre
    card: '#252525',         // Carte sombre
    text: '#FFFFFF',         // Blanc texte
    textSecondary: '#B0B0B0',// Gris clair texte
    textInverse: '#212121',  // Texte inversé
    disabled: '#666666',     // Gris disabled
    border: '#333333',       // Bordures sombres
    shadow: '#000000',       // Ombre
    overlay: 'rgba(0,0,0,0.7)', // Overlay modal
    inputBackground: '#2A2A2A',
    statusBar: 'light-content',
  },
};

// Thème par défaut (rétrocompatibilité)
export const theme = {
  colors: lightTheme.colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    round: 50,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' },
    small: { fontSize: 12, fontWeight: '400' },
  },
};

// Valeurs communes partagées
export const themeBase = {
  spacing: theme.spacing,
  borderRadius: theme.borderRadius,
  typography: theme.typography,
};

export const REPORT_TYPES = {
  CONTROLLER: {
    id: 'controller',
    label: 'Personnel RATP',
    icon: 'account-tie',
    color: '#2196F3',
    description: 'Contrôleur, agent de sécurité',
  },
  INCIDENT: {
    id: 'incident',
    label: 'Incident',
    icon: 'alert',
    color: '#F44336',
    description: 'Agression, pickpocket, bagarre',
  },
  MAINTENANCE: {
    id: 'maintenance',
    label: 'Panne',
    icon: 'wrench',
    color: '#FF9800',
    description: 'Métro arrêté, escalator en panne',
  },
  WORKS: {
    id: 'works',
    label: 'Travaux',
    icon: 'road-variant',
    color: '#FFC107',
    description: 'Station fermée, travaux',
  },
};

// Niveaux XP alignés avec l'algorithme de crédibilité
export const XP_LEVELS = [
  { level: 1, name: 'Novice', minXP: 0, maxXP: 100, color: '#9E9E9E', badge: '🌱', voteWeight: 1, deletionThreshold: 2 },
  { level: 2, name: 'Habitué', minXP: 100, maxXP: 500, color: '#CD7F32', badge: '🥉', voteWeight: 2, deletionThreshold: 4 },
  { level: 3, name: 'Confirmé', minXP: 500, maxXP: 1500, color: '#C0C0C0', badge: '🥈', voteWeight: 3, deletionThreshold: 6 },
  { level: 4, name: 'Expert', minXP: 1500, maxXP: 4000, color: '#FFD700', badge: '🥇', voteWeight: 4, deletionThreshold: 8 },
  { level: 5, name: 'Légende', minXP: 4000, maxXP: Infinity, color: '#E5E4E2', badge: '💎', voteWeight: 5, deletionThreshold: 10 },
];

// Récompenses XP pour chaque action
export const XP_REWARDS = {
  // Actions de signalement
  CREATE_REPORT: 15,              // Créer un signalement
  REPORT_VALIDATED: 30,           // Signalement validé par la communauté (5+ votes positifs)
  REPORT_SUPER_VALIDATED: 50,     // Signalement très validé (20+ votes positifs)

  // Actions de vote
  VOTE: 3,                        // Voter sur un signalement
  VOTE_CORRECT: 5,                // Vote en accord avec la majorité
  VOTE_FIRST: 8,                  // Être parmi les 3 premiers à voter correctement

  // Bonus de connexion
  DAILY_LOGIN: 10,                // Connexion quotidienne
  DAILY_STREAK_BONUS: 5,          // Bonus par jour de streak (ex: 5 jours = +25 XP)
  WEEKLY_STREAK_BONUS: 50,        // Bonus pour 7 jours consécutifs
  MONTHLY_STREAK_BONUS: 200,      // Bonus pour 30 jours consécutifs

  // Actions sociales
  FIRST_REPORT_OF_DAY: 10,        // Premier signalement du jour
  HELP_NEW_USER: 20,              // Voter correctement sur le signalement d'un Novice

  // Succès
  ACHIEVEMENT_UNLOCKED: 25,       // Débloquer un succès
};

// Configuration du système de crédibilité
export const CREDIBILITY_CONFIG = {
  // Seuil de score pour valider un signalement
  VALIDATION_THRESHOLD: 5,        // Score de confiance minimum pour validation

  // Seuil de score négatif pour supprimer un signalement
  // La formule: deletionThreshold de l'auteur (basé sur son niveau)

  // Calcul du score de confiance
  // trustScore = somme(voteWeight des votes positifs) - somme(voteWeight des votes négatifs)

  // Multiplicateur de streak pour les bonus
  MAX_STREAK_MULTIPLIER: 3,       // Multiplicateur max (atteint à 30 jours)
};

// Bonus de connexion par palier de streak
export const STREAK_BONUSES = [
  { days: 3, bonus: 15, name: '3 jours' },
  { days: 7, bonus: 50, name: '1 semaine' },
  { days: 14, bonus: 100, name: '2 semaines' },
  { days: 30, bonus: 200, name: '1 mois' },
  { days: 60, bonus: 400, name: '2 mois' },
  { days: 100, bonus: 1000, name: '100 jours' },
];

export const METRO_LINES = [
  { id: '1', name: 'Ligne 1', color: '#FFCD00' },
  { id: '2', name: 'Ligne 2', color: '#003CA6' },
  { id: '3', name: 'Ligne 3', color: '#837902' },
  { id: '4', name: 'Ligne 4', color: '#BE418D' },
  { id: '5', name: 'Ligne 5', color: '#FF7E2E' },
  { id: '6', name: 'Ligne 6', color: '#6ECA97' },
  { id: '7', name: 'Ligne 7', color: '#FA9ABA' },
  { id: '8', name: 'Ligne 8', color: '#E19BDF' },
  { id: '9', name: 'Ligne 9', color: '#B6BD00' },
  { id: '10', name: 'Ligne 10', color: '#C9910D' },
  { id: '11', name: 'Ligne 11', color: '#704B1C' },
  { id: '12', name: 'Ligne 12', color: '#007852' },
  { id: '13', name: 'Ligne 13', color: '#6EC4E8' },
  { id: '14', name: 'Ligne 14', color: '#62259D' },
  { id: 'A', name: 'RER A', color: '#E3051C' },
  { id: 'B', name: 'RER B', color: '#5291CE' },
];
