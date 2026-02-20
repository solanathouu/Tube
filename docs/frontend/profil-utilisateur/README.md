# Profil utilisateur

Gestion du profil, statistiques et progression.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/screens/ProfileScreen.js` | Dashboard profil |
| `src/screens/EditProfileScreen.js` | Édition du profil |
| `src/components/XPBar.js` | Barre de progression XP |
| `src/services/usersService.js` | Gestion utilisateurs |
| `src/services/authService.js` | Authentification |
| `src/data/mockUser.js` | Utilisateur de démo |

---

## Fonctionnalités

### Dashboard profil
- Avatar + username
- Barre XP animée
- Niveau actuel et progression
- 4 cards de statistiques
- Badges débloqués
- Lignes favorites
- Bouton paramètres

### Édition du profil
- Modifier le username
- Modifier le numéro de téléphone
- Upload de photo de profil
- Validation des champs

### Statistiques affichées
| Stat | Description |
|------|-------------|
| Signalements | Nombre total de signalements créés |
| Votes | Nombre total de votes effectués |
| Streak | Jours consécutifs d'utilisation |
| Remerciements | Nombre de "merci" reçus |

---

## Structure des données utilisateur

```javascript
{
  id: 'uuid',
  email: 'user@tube.app',
  username: 'Metro_Watcher',
  phone_number: '+33612345678',
  profile_picture_url: 'https://...',
  xp: 4120,
  level: 4,
  total_reports: 85,
  total_votes: 342,
  streak: 7,
  badges: ['first_report', 'week_streak', 'vote_master'],
  preferences: {
    favorite_lines: ['1', '4', '14'],
    notifications: true,
    theme: 'dark'
  },
  created_at: '2025-01-01T00:00:00Z'
}
```

---

## Niveaux et XP

| Niveau | Nom | XP requis | Emoji |
|--------|-----|-----------|-------|
| 1 | Bronze | 0 - 999 | 🥉 |
| 2 | Argent | 1,000 - 2,499 | 🥈 |
| 3 | Or | 2,500 - 4,999 | 🥇 |
| 4 | Platine | 5,000 - 9,999 | 💎 |
| 5 | Diamant | 10,000+ | 👑 |

---

## Gains XP

| Action | XP gagnés |
|--------|-----------|
| Créer un signalement | +50 |
| Voter sur un signalement | +10 |
| Recevoir un remerciement | +25 |
| Remercier quelqu'un | +5 |
| Streak quotidien | +15 |

---

## Composant XPBar

Barre de progression animée affichant :
- XP actuel / XP pour niveau suivant
- Pourcentage de progression
- Animation fluide lors des gains

```javascript
<XPBar
  currentXP={4120}
  level={4}
  maxXP={5000}
/>
```
