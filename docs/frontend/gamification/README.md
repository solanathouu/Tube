# Gamification

Système de points XP, niveaux, classement et badges.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/screens/LeaderboardScreen.js` | Classement des joueurs |
| `src/screens/ProfileScreen.js` | Affichage XP et badges |
| `src/components/XPBar.js` | Barre de progression |
| `src/services/usersService.js` | Gestion XP |
| `src/context/AppContext.js` | État XP global |
| `src/theme/theme.js` | Configuration niveaux |

---

## Système XP

### Gains d'XP

| Action | XP | Description |
|--------|------|-------------|
| Créer un signalement | +50 | Contribuer à la communauté |
| Voter | +10 | Valider les signalements |
| Recevoir un remerciement | +25 | Signalement utile |
| Remercier quelqu'un | +5 | Encourager la communauté |
| Streak quotidien | +15 | Connexion consécutive |
| Vote confirmé correct | +5 | Vote validé par la majorité |

### Calcul du niveau
```javascript
function getLevel(xp) {
  if (xp >= 10000) return 5; // Diamant
  if (xp >= 5000) return 4;  // Platine
  if (xp >= 2500) return 3;  // Or
  if (xp >= 1000) return 2;  // Argent
  return 1;                   // Bronze
}
```

---

## Niveaux

| Niveau | Nom | XP requis | Emoji | Couleur |
|--------|-----|-----------|-------|---------|
| 1 | Bronze | 0 - 999 | 🥉 | #CD7F32 |
| 2 | Argent | 1,000 - 2,499 | 🥈 | #C0C0C0 |
| 3 | Or | 2,500 - 4,999 | 🥇 | #FFD700 |
| 4 | Platine | 5,000 - 9,999 | 💎 | #E5E4E2 |
| 5 | Diamant | 10,000+ | 👑 | #B9F2FF |

---

## Classement (Leaderboard)

### Périodes disponibles
- **Semaine** : Classement de la semaine en cours
- **Mois** : Classement du mois en cours
- **Tout temps** : Classement global

### Affichage
- **Top 3** : Podium visuel avec médailles
- **4+** : Liste classée avec rang

### Interface
```
🥇 1. Metro_Watcher     5,200 XP  💎
🥈 2. CityGuardian      4,450 XP  💎
🥉 3. Parisien_92       2,450 XP  🥇
   4. TechSupport       2,100 XP  🥈
   5. [Vous] User123    1,500 XP  🥈 ←
```

---

## Badges

### Badges disponibles

| Badge | ID | Condition |
|-------|-----|-----------|
| Premier signalement | `first_report` | Créer 1 signalement |
| Reporter actif | `active_reporter` | Créer 10 signalements |
| Expert | `expert_reporter` | Créer 50 signalements |
| Votant | `first_vote` | Voter 1 fois |
| Votant régulier | `active_voter` | Voter 50 fois |
| Semaine parfaite | `week_streak` | 7 jours consécutifs |
| Mois parfait | `month_streak` | 30 jours consécutifs |
| Bienfaiteur | `helper` | Recevoir 10 remerciements |
| Légende | `legend` | Atteindre niveau Diamant |

### Stockage
```javascript
user.badges = ['first_report', 'week_streak', 'active_voter'];
```

---

## Composant XPBar

### Props
```javascript
<XPBar
  currentXP={4120}
  level={4}
  levelName="Platine"
  nextLevelXP={5000}
/>
```

### Affichage
```
💎 Platine
[████████████░░░░░░░░] 82%
4,120 / 5,000 XP
```

### Animation
- Animation de remplissage au chargement
- Animation de gain lors de l'ajout d'XP
- Effet de "level up" au passage de niveau

---

## Streak (série)

### Fonctionnement
- +1 streak à chaque jour de connexion
- Reset à 0 si un jour est manqué
- Bonus XP à certains paliers (7, 30, 100 jours)

### Paliers bonus
| Streak | Bonus |
|--------|-------|
| 7 jours | +50 XP |
| 30 jours | +200 XP |
| 100 jours | +500 XP |

---

## Intégration Context

```javascript
const { user, addXP } = useApp();

// Ajouter de l'XP
const handleReport = async () => {
  await createReport(data);
  addXP(50); // +50 XP pour signalement
};
```
