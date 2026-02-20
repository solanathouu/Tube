# Préférences

Lignes favorites, notifications et personnalisation.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/screens/FavoriteLinesScreen.js` | Sélection lignes favorites |
| `src/screens/FavoriteRoutesScreen.js` | Configuration trajets quotidiens |
| `src/screens/NotificationSettingsScreen.js` | Paramètres notifications |
| `src/context/ThemeContext.js` | Gestion du thème |
| `src/services/notificationService.js` | Push notifications |
| `src/services/usersService.js` | Persistence des préférences |

---

## Lignes favorites

### Fonctionnalités
- Sélectionner les lignes de métro favorites
- Sections séparées : Métro / RER
- Notifications prioritaires sur ces lignes
- Accès rapide aux perturbations

### Interface
- Liste de toutes les lignes avec couleurs officielles
- Toggle pour chaque ligne
- Sauvegarde automatique

### Lignes disponibles
**Métro** : 1, 2, 3, 3bis, 4, 5, 6, 7, 7bis, 8, 9, 10, 11, 12, 13, 14
**RER** : A, B, C, D, E

---

## Trajets favoris

### Fonctionnalités
- Enregistrer des trajets quotidiens
- Définir station de départ
- Définir station d'arrivée
- Accès rapide pour calcul d'itinéraire

### Usage
1. Écran FavoriteRoutesScreen
2. Ajouter un nouveau trajet
3. Sélectionner départ et arrivée
4. Le trajet est sauvegardé

---

## Notifications

### Catégories

| Catégorie | Description |
|-----------|-------------|
| **Alertes** | Signalements à proximité |
| **Rappels** | Rappels quotidiens |
| **Actualités** | Mises à jour de l'app |

### Paramètres disponibles
- Activer/désactiver toutes les notifications
- Toggle par catégorie
- Rayon de proximité (défaut: 500m)
- Heure des rappels quotidiens

### Structure des préférences
```javascript
{
  enabled: true,
  categories: {
    alerts: true,
    reminders: true,
    news: false
  },
  proximity_radius: 500, // mètres
  reminder_time: '08:00'
}
```

---

## Thème

### Modes disponibles
| Mode | Description |
|------|-------------|
| `light` | Thème clair |
| `dark` | Thème sombre |
| `system` | Suit le système |

### Usage
```javascript
const { theme, setTheme } = useTheme();
setTheme('dark');
```

### Couleurs principales

**Mode clair**
```javascript
{
  primary: '#2196F3',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121'
}
```

**Mode sombre**
```javascript
{
  primary: '#2196F3',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF'
}
```

---

## Persistence

Les préférences sont stockées :
- **Localement** : AsyncStorage
- **Serveur** : Table `users.preferences` (JSON)

Synchronisation automatique à la connexion.
