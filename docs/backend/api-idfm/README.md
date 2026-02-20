# API IDFM

Intégration des données officielles Île-de-France Mobilités.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/services/idfmService.js` | Client API IDFM |
| `src/components/TrafficStatusBar.js` | Affichage perturbations |
| `src/components/RouteCalculator.js` | Calcul itinéraires |
| `src/components/NextDepartures.js` | Prochains passages |

---

## Configuration

### Base URL
```
https://prim.iledefrance-mobilites.fr/marketplace
```

### API Key
Stockée dans `.env` ou directement dans le code (MVP).

```javascript
const API_KEY = 'votre-cle-api';

const headers = {
  'apiKey': API_KEY,
  'Content-Type': 'application/json'
};
```

---

## Endpoints utilisés

### 1. Perturbations réseau

**GET** `/v2/navitia/disruptions`

Récupère toutes les perturbations actives.

```javascript
export const getTrafficInfo = async () => {
  const response = await fetch(
    `${BASE_URL}/v2/navitia/disruptions`,
    { headers }
  );
  return parseNavitiaDisruptionsV2(await response.json());
};
```

**Réponse** :
```json
{
  "disruptions": [
    {
      "id": "disruption-123",
      "severity": {
        "priority": 1,
        "effect": "REDUCED_SERVICE"
      },
      "impacted_objects": [{
        "pt_object": {
          "line": { "code": "1" }
        }
      }],
      "messages": [{
        "text": "Trafic perturbé entre Châtelet et La Défense",
        "channel": { "types": ["web"] }
      }],
      "status": "active"
    }
  ]
}
```

### 2. Calcul d'itinéraire

**GET** `/v2/navitia/journeys`

Calcule un itinéraire entre deux points.

```javascript
export const calculateRoute = async (from, to, datetime) => {
  const fromCoord = `${from.longitude};${from.latitude}`;
  const toCoord = `${to.longitude};${to.latitude}`;
  const datetimeStr = datetime.toISOString().replace(/[-:]/g, '').split('.')[0];

  const response = await fetch(
    `${BASE_URL}/v2/navitia/journeys?from=${fromCoord}&to=${toCoord}&datetime=${datetimeStr}`,
    { headers }
  );
  return parseJourneys(await response.json());
};
```

**Paramètres** :
| Param | Type | Description |
|-------|------|-------------|
| `from` | string | Coordonnées départ (lng;lat) |
| `to` | string | Coordonnées arrivée (lng;lat) |
| `datetime` | string | Date/heure (YYYYMMDDTHHMMSS) |

**Réponse** :
```json
{
  "journeys": [{
    "duration": 1800,
    "sections": [
      { "type": "walking", "duration": 120 },
      { "type": "public_transport", "line": "1", "from": "Châtelet", "to": "La Défense" },
      { "type": "walking", "duration": 60 }
    ],
    "departure_date_time": "20250128T100000",
    "arrival_date_time": "20250128T103000"
  }]
}
```

### 3. Prochains passages

**GET** `/stop-monitoring`

Récupère les prochains passages à un arrêt.

```javascript
export const getNextDepartures = async (stopId) => {
  const response = await fetch(
    `${BASE_URL}/stop-monitoring?MonitoringRef=${stopId}`,
    { headers }
  );
  return parseNextDepartures(await response.json());
};
```

**Paramètres** :
| Param | Type | Description |
|-------|------|-------------|
| `MonitoringRef` | string | ID de l'arrêt IDFM |

### 4. Recherche d'arrêts

**GET** `/v2/navitia/places`

Recherche des arrêts par nom ou coordonnées.

```javascript
export const searchPlaces = async (query, coords = null) => {
  let url = `${BASE_URL}/v2/navitia/places?q=${encodeURIComponent(query)}`;
  if (coords) {
    url += `&from=${coords.longitude};${coords.latitude}`;
  }

  const response = await fetch(url, { headers });
  return parsePlaces(await response.json());
};
```

---

## Identifiants des lignes

```javascript
export const LINE_IDS = {
  // Métro
  '1': 'IDFM:C01371',
  '2': 'IDFM:C01372',
  '3': 'IDFM:C01373',
  '3bis': 'IDFM:C01386',
  '4': 'IDFM:C01374',
  '5': 'IDFM:C01375',
  '6': 'IDFM:C01376',
  '7': 'IDFM:C01377',
  '7bis': 'IDFM:C01387',
  '8': 'IDFM:C01378',
  '9': 'IDFM:C01379',
  '10': 'IDFM:C01380',
  '11': 'IDFM:C01381',
  '12': 'IDFM:C01382',
  '13': 'IDFM:C01383',
  '14': 'IDFM:C01384',
  // RER
  'A': 'IDFM:C01742',
  'B': 'IDFM:C01743',
  'C': 'IDFM:C01727',
  'D': 'IDFM:C01728',
  'E': 'IDFM:C01729'
};
```

---

## Refresh automatique

Les perturbations sont rafraîchies toutes les 2 minutes.

```javascript
useEffect(() => {
  const loadDisruptions = async () => {
    const result = await idfmService.getTrafficInfo();
    if (result.success) {
      setOfficialDisruptions(result.disruptions);
    }
  };

  loadDisruptions();
  const interval = setInterval(loadDisruptions, 2 * 60 * 1000);

  return () => clearInterval(interval);
}, []);
```

---

## Calcul temps d'attente

```javascript
const calculateWaitTime = (departureTimeStr) => {
  // Format: YYYYMMDDTHHMMSS
  const year = departureTimeStr.slice(0, 4);
  const month = departureTimeStr.slice(4, 6);
  const day = departureTimeStr.slice(6, 8);
  const hour = departureTimeStr.slice(9, 11);
  const minute = departureTimeStr.slice(11, 13);

  const departure = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  const now = new Date();

  const diffMs = departure - now;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return diffMinutes > 0 ? diffMinutes : 0;
};
```

---

## Gestion des erreurs

```javascript
try {
  const result = await getTrafficInfo();
  if (!result.success) {
    console.error('API Error:', result.error);
    // Utiliser les données en cache
  }
} catch (error) {
  console.error('Network Error:', error);
  // Mode offline
}
```

---

## Ressources

- [Portail PRIM](https://prim.iledefrance-mobilites.fr)
- [Documentation API](https://prim.iledefrance-mobilites.fr/fr/donnees-dynamiques)
- [Format Navitia](https://navitia.io/documentation/)
