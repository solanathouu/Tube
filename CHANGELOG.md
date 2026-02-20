# 📝 Changelog - Tube App

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.0.0] - 2025-11-19 - MVP Initial Release ✨

### 🎉 Première version complète du MVP

Cette version initiale contient toutes les fonctionnalités de base pour un MVP fonctionnel.

### ✅ Ajouté

#### 🏗️ Infrastructure
- Configuration Expo complète (SDK 50)
- Architecture React Native avec navigation
- Context API pour la gestion d'état global
- Design system complet avec thème personnalisé
- Composants réutilisables modulaires

#### 📱 Écrans
- **SplashScreen** : Écran de démarrage animé avec logo
- **OnboardingScreen** : 3 slides d'introduction avec pagination
- **AuthScreen** : Écran de connexion mockée
- **MapScreen** : Carte interactive avec markers (écran principal)
- **ReportListScreen** : Liste scrollable des signalements
- **ProfileScreen** : Profil utilisateur avec stats et XP

#### 🧩 Composants
- **FilterBar** : Barre de filtres horizontale scrollable (5 filtres)
- **ReportCard** : Card pour afficher un signalement dans la liste
- **ReportMarker** : Marker personnalisé pour la carte avec callout
- **ReportModal** : Modal de création de signalement (bottom sheet)
- **XPBar** : Barre de progression XP animée avec badges de niveau

#### 🗺️ Navigation
- Stack Navigator pour le flow d'authentification
- Bottom Tab Navigator avec 3 onglets (Carte, Liste, Profil)
- Transitions fluides entre écrans
- Gestion automatique de l'état d'authentification

#### 📊 Données mockées
- **36 stations de métro** : Ligne 1 (25 stations) + Ligne 14 (11 stations)
- **15 signalements variés** : 7 contrôleurs, 4 incidents, 3 pannes, 1 travaux
- **Utilisateur démo complet** : Stats, XP, succès, préférences
- Coordonnées GPS réelles de Paris
- Timestamps réalistes (2-28 minutes)

#### 🎨 Design
- Palette de couleurs cohérente (bleu métro)
- 4 types de signalements avec couleurs distinctes
- 4 niveaux XP avec badges (Bronze, Argent, Or, Platine)
- Typographie hiérarchisée
- Espacements constants (design system)
- Material Design avec React Native Paper

#### ⚙️ Fonctionnalités
- Connexion mockée (accepte n'importe quelles credentials)
- Affichage de 15 signalements sur carte interactive
- Filtrage par type de signalement (temps réel)
- Création de signalements (4 étapes : type, ligne, station, commentaire)
- Système de votes (👍 Là / 👎 Pas là)
- Système XP et niveaux (+10 XP création, +5 XP vote)
- Calcul automatique du niveau utilisateur
- Barre de progression expiration (30 minutes)
- Pull-to-refresh simulé
- 5 succès débloquables
- Statistiques utilisateur détaillées
- Lignes favorites

#### 🛠️ Fonctions utilitaires
- `calculateLevel(xp)` : Calcul du niveau actuel
- `formatTimeAgo(date)` : Formatage "Il y a X min"
- `getTimeRemaining(expiresAt)` : Temps restant avant expiration
- `calculateXPProgress(xp)` : Pourcentage de progression
- `generateId()` : Génération d'ID unique
- `isReportActive(report)` : Vérification si actif
- `calculateConfidenceScore(votes)` : Score de confiance

#### 📚 Documentation
- README.md complet avec guide d'installation
- QUICKSTART.md pour démarrage rapide (5 minutes)
- PROJECT_SUMMARY.md avec résumé détaillé
- TESTING_CHECKLIST.md avec 20+ tests
- FILE_STRUCTURE.md avec arborescence complète
- GENERATE_ICONS.md pour création d'assets
- CHANGELOG.md (ce fichier)

#### 🎭 Animations
- Splash screen fadeIn
- Onboarding slide transitions
- Modal slide up/down
- XP bar progression animée
- Navigation transitions
- Pull-to-refresh spinner

### 🔒 Limitations connues (MVP)

#### Backend
- ❌ Pas de backend réel
- ❌ Pas d'API REST
- ❌ Pas de base de données
- ❌ Pas de persistance des données

#### Authentification
- ❌ Connexion mockée (pas de sécurité)
- ❌ Pas de validation d'email
- ❌ Pas de hashage de mot de passe
- ❌ Pas de session persistante

#### Fonctionnalités
- ❌ Pas de géolocalisation réelle
- ❌ Pas de notifications push
- ❌ Pas d'upload de photos
- ❌ Pas de système de modération
- ❌ Pas de mode hors ligne
- ❌ Pas de partage social

#### Données
- ⚠️ Les signalements créés ne persistent pas (refresh = reset)
- ⚠️ Les votes ne sont pas sauvegardés
- ⚠️ L'XP ne persiste pas entre sessions
- ⚠️ Seulement 2 lignes de métro couvertes (1 et 14)

### 📦 Dépendances

#### Production
```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "react-native-maps": "1.10.0",
  "react-native-paper": "^5.11.0",
  "react-native-vector-icons": "^10.0.3",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "react-native-safe-area-context": "4.8.2",
  "react-native-screens": "~3.29.0",
  "@react-native-async-storage/async-storage": "1.21.0",
  "react-native-gesture-handler": "~2.14.0",
  "react-native-reanimated": "~3.6.2"
}
```

### 🐛 Bugs connus

- ⚠️ Sur iOS dans Expo Go, la carte peut avoir des limitations (utiliser Android de préférence)
- ⚠️ Les assets (icon.png, splash.png) ne sont pas générés (warning au démarrage)
- ⚠️ La clé Google Maps API doit être configurée pour la production

### 🚀 Prochaines versions planifiées

#### [1.1.0] - Backend & Authentification (à venir)
- [ ] Intégration Firebase Authentication
- [ ] API REST avec Node.js + Express
- [ ] Base de données Firestore
- [ ] Persistance des données
- [ ] Sessions utilisateur

#### [1.2.0] - Fonctionnalités avancées (à venir)
- [ ] Géolocalisation automatique
- [ ] Notifications push
- [ ] Upload de photos
- [ ] Système de modération
- [ ] Signalement des abus

#### [1.3.0] - Améliorations UX (à venir)
- [ ] Mode hors ligne avec cache
- [ ] Thème sombre
- [ ] Internationalisation (i18n)
- [ ] Statistiques avancées
- [ ] Classement communautaire

#### [2.0.0] - Production ready (à venir)
- [ ] Toutes les lignes de métro Paris
- [ ] RER et Transilien
- [ ] Autres villes (Lyon, Marseille, etc.)
- [ ] Application iOS et Android natives
- [ ] Tests unitaires et e2e
- [ ] CI/CD pipeline
- [ ] Monitoring et analytics

### 📊 Métriques

#### Code
- **Fichiers créés** : 31
- **Lignes de code** : ~3500+
- **Composants** : 5
- **Écrans** : 6
- **Fonctions** : 20+

#### Fonctionnalités
- **Stations** : 36
- **Signalements mockés** : 15
- **Types de signalements** : 4
- **Niveaux XP** : 4
- **Succès** : 5

### 🎯 Objectifs atteints

- ✅ MVP 100% fonctionnel
- ✅ UI/UX moderne et professionnelle
- ✅ Navigation fluide
- ✅ Système de gamification
- ✅ Documentation complète
- ✅ Prêt pour démo

### 🙏 Remerciements

- React Native et Expo pour le framework
- React Navigation pour la navigation
- React Native Maps pour les cartes
- MaterialCommunityIcons pour les icônes
- La communauté open source

---

## Format du Changelog

Ce changelog suit le format [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

### Types de changements

- **Ajouté** : nouvelles fonctionnalités
- **Modifié** : changements de fonctionnalités existantes
- **Déprécié** : fonctionnalités bientôt supprimées
- **Supprimé** : fonctionnalités supprimées
- **Corrigé** : corrections de bugs
- **Sécurité** : en cas de vulnérabilités

### Versioning

- **MAJOR** (X.0.0) : changements incompatibles avec les versions précédentes
- **MINOR** (0.X.0) : ajout de fonctionnalités rétrocompatibles
- **PATCH** (0.0.X) : corrections de bugs rétrocompatibles

---

**Version actuelle** : 1.0.0 (MVP)
**Dernière mise à jour** : 2025-11-19
