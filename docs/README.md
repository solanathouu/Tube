# Documentation Tube

Index de la documentation organisée par fonctionnalité.

---

## Démarrage

| Document | Description |
|----------|-------------|
| [getting-started/](getting-started/) | Installation et lancement |
| [getting-started/troubleshooting.md](getting-started/troubleshooting.md) | Résolution de problèmes |

---

## Frontend

| Fonctionnalité | Description | Fichiers source |
|----------------|-------------|-----------------|
| [Carte & Navigation](frontend/carte-navigation/) | Carte interactive, calcul d'itinéraires, navigation | `MapScreen.js`, `RouteCalculator.js` |
| [Signalements](frontend/signalements/) | Création, vote, liste des incidents | `ReportListScreen.js`, `ReportModal.js` |
| [Profil utilisateur](frontend/profil-utilisateur/) | Profil, édition, statistiques | `ProfileScreen.js`, `EditProfileScreen.js` |
| [Système social](frontend/systeme-social/) | Amis, contacts, partage de trajet | `FriendsScreen.js`, `LiveShareScreen.js` |
| [Préférences](frontend/preferences/) | Lignes favorites, notifications, thème | `FavoriteLinesScreen.js`, `NotificationSettingsScreen.js` |
| [Gamification](frontend/gamification/) | XP, niveaux, classement, badges | `LeaderboardScreen.js`, `XPBar.js` |

---

## Backend

| Fonctionnalité | Description | Fichiers source |
|----------------|-------------|-----------------|
| [Authentification](backend/authentification/) | Auth Supabase, sessions | `authService.js` |
| [Base de données](backend/base-de-donnees/) | Schéma PostgreSQL, migrations, fonctions | `supabase/migrations/` |
| [API IDFM](backend/api-idfm/) | Intégration données officielles RATP | `idfmService.js` |
| [Notifications](backend/notifications/) | Push notifications Expo | `notificationService.js` |

---

## Archive

Documents historiques : [archive/](archive/)
