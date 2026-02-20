# Signalements

Système communautaire de signalement et de vote sur les incidents.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/screens/ReportListScreen.js` | Liste des signalements |
| `src/screens/MapScreen.js` | Affichage sur carte |
| `src/components/ReportCard.js` | Card d'un signalement |
| `src/components/ReportMarker.js` | Marker carte |
| `src/components/ReportModal.js` | Création de signalement |
| `src/components/ReportDetailModal.js` | Détails + vote |
| `src/components/FilterBar.js` | Filtres par type |
| `src/services/reportsService.js` | CRUD signalements |
| `src/data/mockReports.js` | Données de démo |

---

## Types de signalements

| Type | Icône | Couleur | Description |
|------|-------|---------|-------------|
| `controller` | `account-tie` | Bleu #2196F3 | Contrôleurs RATP |
| `incident` | `alert` | Rouge #F44336 | Incidents, accidents |
| `maintenance` | `wrench` | Orange #FF9800 | Pannes, équipements HS |
| `works` | `road-variant` | Jaune #FFC107 | Travaux, fermetures |

---

## Fonctionnalités

### Créer un signalement
1. Cliquer sur le bouton **+** (FAB)
2. Sélectionner le type
3. Choisir la ligne
4. Sélectionner la station
5. Ajouter un commentaire (optionnel, 200 car. max)
6. Valider → **+10 XP**

### Voter sur un signalement
- **Présent** (👍) : Confirme le signalement
- **Absent** (👎) : Infirme le signalement
- Gain : **+5 XP** par vote

### Remercier l'auteur
- Bouton "Merci" sur un signalement utile
- L'auteur gagne **+25 XP**
- Vous gagnez **+5 XP**

---

## Cycle de vie d'un signalement

```
Création (10 XP)
    ↓
Actif (30 minutes)
    ↓
Votes communautaires
    ↓
Expiration automatique
```

- Durée de vie : **30 minutes** par défaut
- Auto-expiration gérée par le backend

---

## Structure des données

```javascript
{
  id: 'uuid',
  type: 'controller',
  station_id: 'chatelet',
  station_name: 'Châtelet',
  line: '1',
  coordinates: { latitude: 48.8584, longitude: 2.3475 },
  author_id: 'user-uuid',
  author_username: 'Metro_Watcher',
  author_level: 4,
  comment: 'Contrôle en cours direction La Défense',
  votes_present: ['user1', 'user2'],
  votes_absent: ['user3'],
  thanks: ['user4'],
  status: 'active',
  created_at: '2025-01-28T10:00:00Z',
  expires_at: '2025-01-28T10:30:00Z'
}
```

---

## Score de confiance

Calculé à partir des votes :
```
confiance = votes_present / (votes_present + votes_absent) * 100
```

Affiché en pourcentage sur chaque signalement.

---

## Filtres disponibles

| Filtre | Description |
|--------|-------------|
| Tous | Affiche tous les signalements actifs |
| Contrôleurs | Uniquement les contrôles |
| Incidents | Uniquement les incidents |
| Pannes | Uniquement les pannes |
| Travaux | Uniquement les travaux |

Les filtres s'appliquent à la fois sur la carte et dans la liste.
