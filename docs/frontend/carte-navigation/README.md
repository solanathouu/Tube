# Carte & Navigation

Fonctionnalité de carte interactive avec calcul d'itinéraires et navigation temps réel.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/screens/MapScreen.js` | Écran principal avec carte |
| `src/components/RouteCalculator.js` | Calcul d'itinéraires |
| `src/components/SearchModal.js` | Recherche d'adresses/stations |
| `src/components/TrafficStatusBar.js` | Barre de statut réseau |
| `src/components/FilterBar.js` | Filtres de signalements |
| `src/components/ReportMarker.js` | Markers sur la carte |
| `src/services/locationTrackingService.js` | Suivi GPS |
| `src/services/idfmService.js` | Données IDFM officielles |
| `src/data/mockStations.js` | Base de 302 stations Paris |

---

## Fonctionnalités

### Carte interactive
- Carte Google Maps centrée sur Paris
- Markers colorés par type de signalement
- Filtrage par catégorie (contrôleurs, incidents, pannes, travaux)
- Zoom et déplacement fluides

### Recherche d'adresses
- Autocomplétion via Nominatim (OpenStreetMap)
- Recherche de stations par nom
- Géocodage des adresses

### Calcul d'itinéraire
- Route entre deux points (départ/arrivée)
- Affichage des correspondances
- Temps d'attente en temps réel
- Estimation de la durée totale
- Distance de marche

### Navigation active
- Suivi GPS en temps réel
- Instructions étape par étape
- Alertes sur le trajet
- Calcul de distance (formule Haversine)

---

## Architecture

```
MapScreen
├── TrafficStatusBar (perturbations IDFM)
├── MapView (Google Maps)
│   └── ReportMarker[] (signalements)
├── FilterBar (filtres)
├── FAB "+" (nouveau signalement)
├── SearchModal (recherche)
└── RouteCalculator (itinéraires)
```

---

## Données des stations

302 stations du métro parisien avec :
- Nom de la station
- Coordonnées GPS (lat/lng)
- Ligne(s) de métro
- Couleur officielle de la ligne

```javascript
// Exemple mockStations.js
{
  id: 'chatelet',
  name: 'Châtelet',
  lines: ['1', '4', '7', '11', '14'],
  coordinates: { latitude: 48.8584, longitude: 2.3475 }
}
```

---

## API IDFM utilisées

| Endpoint | Usage |
|----------|-------|
| `/v2/navitia/disruptions` | Perturbations réseau |
| `/v2/navitia/journeys` | Calcul d'itinéraires |
| `/v2/navitia/places` | Recherche d'arrêts |
| `/stop-monitoring` | Prochains passages |

Voir [backend/api-idfm/](../../backend/api-idfm/) pour les détails.

---

## Permissions requises

- `Location` : Pour la géolocalisation
- `LocationAlways` : Pour le suivi en arrière-plan (navigation)
