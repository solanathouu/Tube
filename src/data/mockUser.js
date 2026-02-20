// Données utilisateur mockées

export const mockUser = {
  id: 'current_user',
  email: 'demo@tube.app',
  username: 'Demo_User',
  xp: 1350,
  level: 2, // Argent
  createdAt: new Date('2025-01-01'),
  stats: {
    totalReports: 54,
    validatedReports: 42,
    totalVotes: 128,
    correctVotes: 103,
    streak: 7, // Jours consécutifs
  },
  preferences: {
    favoriteLines: ['1', '14'],
    notifications: true,
  },
  achievements: {
    firstReport: true,
    tenValidated: true,
    silverLevel: true,
    hundredVotes: false,
    thirtyDayStreak: false,
  },
};
