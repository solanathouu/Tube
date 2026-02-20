<p align="center">
  <img src="assets/logo.png" alt="Tube Logo" width="120" />
</p>

<h1 align="center">Tube</h1>

<p align="center">
  <strong>Application communautaire de signalement en temps reel pour les transports parisiens</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey" alt="Platform" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version" />
</p>

---

Tube permet aux usagers du metro parisien de **signaler et consulter en temps reel** les incidents, controles, travaux et pannes sur le reseau. Chaque signalement est valide par la communaute via un systeme de votes, et les utilisateurs gagnent de l'XP en contribuant.

## Fonctionnalites

**Carte interactive** - Visualisez les signalements geolocalises sur les 302 stations du metro parisien avec Google Maps et clustering de marqueurs.

**Signalements communautaires** - Creez et votez sur 4 types d'incidents : controles, incidents, maintenance et travaux. Chaque signalement expire automatiquement.

**Donnees officielles IDFM** - Les perturbations officielles RATP/IDFM sont affichees en temps reel via l'API PRIM Ile-de-France Mobilites.

**Gamification** - Gagnez de l'XP en signalant, votant et en vous connectant quotidiennement. 5 niveaux (Novice a Legende), badges et classement communautaire.

**Systeme social** - Ajoutez des amis, importez vos contacts, et partagez votre trajet en direct avec vos proches.

**Calcul d'itineraire** - Trouvez le meilleur chemin avec detection de la station la plus proche et temps d'attente.

**Theme clair/sombre** - Interface adaptative avec detection des preferences systeme.

## Demarrage rapide

### Prerequis

- [Node.js](https://nodejs.org/) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) sur votre telephone
- Un projet [Supabase](https://supabase.com/) (plan gratuit suffisant)

### Installation

```bash
# Cloner le repo
git clone https://github.com/votre-username/tube.git
cd tube

# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir .env avec vos cles (voir section Configuration)

# Lancer l'app
npx expo start
```

Scannez le QR code avec Expo Go pour voir l'app sur votre telephone.

### Configuration

Copiez `.env.example` en `.env` et renseignez vos cles :

| Variable | Description | Ou l'obtenir |
|----------|-------------|--------------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | [Supabase Dashboard](https://supabase.com/dashboard) > Settings > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Cle publique (anon) Supabase | Supabase Dashboard > Settings > API |
| `EXPO_PUBLIC_IDFM_API_KEY` | Cle API PRIM IDFM | [prim.iledefrance-mobilites.fr](https://prim.iledefrance-mobilites.fr/) |
| `EXPO_PUBLIC_FIREBASE_*` | Configuration Firebase | [Firebase Console](https://console.firebase.google.com/) |

### Base de donnees

Appliquez les migrations SQL dans l'ordre depuis `supabase/migrations/` dans l'editeur SQL de votre projet Supabase. Puis optionnellement :

```bash
# Charger des donnees de test
npm install dotenv
node supabase/seed.js
```

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React Native 0.81, Expo SDK 54, React Navigation 6 |
| **UI** | React Native Paper, Vector Icons, Reanimated |
| **Carte** | react-native-maps (Google Maps) |
| **Backend** | Supabase (Auth + PostgreSQL + PostGIS) |
| **API externe** | PRIM Ile-de-France Mobilites (perturbations, itineraires) |
| **Notifications** | Expo Notifications + Firebase Cloud Messaging |
| **State** | React Context API + AsyncStorage |

## Architecture

```
src/
├── screens/          # 16 ecrans (Map, Auth, Profil, Amis, Leaderboard...)
├── components/       # Composants reutilisables (ReportCard, XPBar, FilterBar...)
├── services/         # Couche API (auth, reports, friends, IDFM, notifications...)
├── context/          # Etat global (AppContext, ThemeContext)
├── config/           # Clients Supabase & Firebase
├── data/             # 302 stations de metro avec coordonnees GPS
├── theme/            # Design system (couleurs, niveaux XP, types de signalement)
└── utils/            # Helpers et calcul d'itineraire

supabase/
├── migrations/       # 12 fichiers SQL (schema, RLS, fonctions)
└── seed.js           # Script de donnees de test

docs/                 # Documentation detaillee par fonctionnalite
```

## Schema de la base de donnees

| Table | Description |
|-------|-------------|
| `users` | Profils, XP, badges, statistiques, preferences |
| `reports` | Signalements avec coordonnees PostGIS, votes, expiration |
| `friendships` | Relations d'amitie bidirectionnelles |
| `friend_requests` | Demandes d'amis en attente |
| `active_trips` | Trajets en cours avec itineraires |
| `live_shares` | Sessions de partage de position en direct |

Toutes les tables utilisent Row Level Security (RLS) pour la protection des donnees.

## Systeme de gamification

| Niveau | XP requis | Badge |
|--------|----------|-------|
| Novice | 0 | Debutant |
| Habitue | 100 | Bronze |
| Confirme | 500 | Argent |
| Expert | 1 500 | Or |
| Legende | 4 000 | Diamant |

Actions recompensees : creation de signalement (+15 XP), vote (+3 XP), validation communautaire (+30 XP), connexion quotidienne (+10 XP), streak 7 jours (+50 XP).

## Scripts utiles

```bash
npx expo start            # Demarrer le serveur de dev
npx expo start -c         # Demarrer avec cache vide
npx expo start --tunnel   # Mode tunnel (reseau distant)
npx expo doctor           # Verifier la compatibilite des dependances
node supabase/seed.js     # Injecter les donnees de test
```

## Documentation

Une documentation detaillee est disponible dans le dossier [`docs/`](docs/) :

- **[Getting Started](docs/getting-started/)** - Installation et troubleshooting
- **[Carte & Navigation](docs/frontend/carte-navigation/)** - Carte interactive et itineraires
- **[Signalements](docs/frontend/signalements/)** - Creation et votes
- **[Systeme social](docs/frontend/systeme-social/)** - Amis et partage de trajet
- **[Gamification](docs/frontend/gamification/)** - XP, niveaux et badges
- **[Authentification](docs/backend/authentification/)** - Auth Supabase
- **[Base de donnees](docs/backend/base-de-donnees/)** - Schema PostgreSQL et migrations
- **[API IDFM](docs/backend/api-idfm/)** - Integration donnees officielles

Voir aussi [`ONBOARDING.md`](ONBOARDING.md) pour un guide de contribution rapide (10 min).

## Contribuer

1. Forkez le repo
2. Creez votre branche (`git checkout -b feature/ma-fonctionnalite`)
3. Commitez (`git commit -m 'feat: ajout de ma fonctionnalite'`)
4. Pushez (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## Licence

Ce projet est un MVP de demonstration. Contactez les mainteneurs pour toute utilisation commerciale.

---

<p align="center"><strong>Tube</strong> - Ou vous allez, on y est</p>
