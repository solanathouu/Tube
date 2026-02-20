# 🚀 Roadmap vers un MVP Fonctionnel - Tube App

Guide complet pour transformer l'app mockée en application production-ready.

---

## 📋 Vue d'ensemble

**État actuel** : MVP avec UI complète, navigation GPS et données mockées ✅
**Objectif** : Application fonctionnelle avec backend, auth, et données réelles

**Temps estimé total** : 3-5 semaines (selon votre expérience)

---

## ✅ Fonctionnalités déjà implémentées

### Navigation & Carte
- ✅ Carte interactive avec Google Maps
- ✅ Centrage automatique sur la position utilisateur au démarrage
- ✅ Bouton "Ma position" pour recentrer
- ✅ Marqueurs de signalements sur la carte
- ✅ Filtres par type (Contrôleurs, Incidents, Pannes)

### Recherche d'itinéraire
- ✅ Barre de recherche animée avec autocomplétion (Nominatim/OpenStreetMap)
- ✅ Cache des suggestions pour plus de fluidité
- ✅ Calcul d'itinéraire métro (direct, 1 ou 2 correspondances)
- ✅ Affichage du temps de trajet estimé
- ✅ Preview compact de l'itinéraire (bouton avec durée + lignes)
- ✅ Vue détaillée des étapes (marche + métro + marche)

### Mode Navigation
- ✅ Polylines colorées par ligne de métro
- ✅ Lignes pointillées pour les trajets à pied
- ✅ Marqueurs pour stations d'entrée/sortie et destination
- ✅ Affichage des alertes sur le trajet
- ✅ Vue étendue avec toutes les étapes (chevron toggle)
- ✅ Suivi GPS en temps réel pendant la navigation
- ✅ Indicateur de progression dynamique (masque les étapes complétées)
- ✅ Mise à jour automatique de l'étape en cours

### UI/UX
- ✅ Design moderne avec thème personnalisé
- ✅ Animations fluides (barre de recherche, transitions)
- ✅ Splash screen
- ✅ Navigation par onglets (Carte, Liste, Profil)
- ✅ Modal de signalement

---

## Phase 1 : Backend & Base de données (2 semaines)

### 1.1 Choix de la stack backend

**Option A : Firebase (Recommandé pour démarrer rapidement)**
- ✅ Avantages : Temps réel, facile à configurer, scalable
- ⏱️ Temps : 3-5 jours
- 💰 Coût : Gratuit jusqu'à 50k utilisateurs/mois

**Option B : Backend Node.js custom**
- ✅ Avantages : Contrôle total, pas de vendor lock-in
- ⏱️ Temps : 1-2 semaines
- 💰 Coût : Serveur (~10-50€/mois)

### 1.2 Setup Firebase (Option recommandée)

**À faire :**
```bash
# 1. Installer Firebase
npm install firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# 2. Créer projet sur Firebase Console
# - Aller sur https://console.firebase.google.com
# - Créer nouveau projet "Tube"
# - Activer Authentication (Email/Password)
# - Activer Firestore Database
```

**Fichiers à créer :**
- `src/config/firebase.js` - Configuration Firebase
- `src/services/authService.js` - Gestion authentification
- `src/services/reportsService.js` - CRUD signalements
- `src/services/usersService.js` - Gestion utilisateurs

**Coût** : Gratuit (plan Spark)

### 1.3 Structure Firestore

**Collections à créer :**

```javascript
// Collection "users"
{
  uid: "user123",
  email: "user@example.com",
  username: "User_123",
  xp: 1350,
  level: 2,
  createdAt: timestamp,
  stats: {
    totalReports: 54,
    validatedReports: 42,
    totalVotes: 128,
    correctVotes: 103,
    streak: 7
  },
  preferences: {
    favoriteLines: ["1", "14"],
    notifications: true
  }
}

// Collection "reports"
{
  id: "report123",
  type: "controller", // controller | incident | maintenance | works
  stationId: "L1_15",
  stationName: "Châtelet",
  line: "1",
  coordinates: {
    latitude: 48.8583,
    longitude: 2.3472
  },
  createdAt: timestamp,
  expiresAt: timestamp, // createdAt + 30 minutes
  authorId: "user123",
  author: {
    username: "User_123",
    level: 2
  },
  votes: {
    present: ["user1", "user2"], // Array d'UIDs
    absent: ["user3"]
  },
  status: "active", // active | expired | removed
  comment: "Équipe de 3 personnes"
}

// Collection "stations" (optionnel, peut rester en local)
{
  id: "L1_15",
  name: "Châtelet",
  line: "1",
  lineColor: "#FFCD00",
  coordinates: {...}
}

// Collection "votes" (pour tracking)
{
  reportId: "report123",
  userId: "user456",
  vote: "present", // present | absent
  timestamp: timestamp
}
```

**Règles de sécurité Firestore :**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Reports
    match /reports/{reportId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.authorId == request.auth.uid;
    }

    // Votes
    match /votes/{voteId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Phase 2 : Authentification (3-5 jours)

### 2.1 Remplacer l'auth mockée

**Fichier à modifier : `src/context/AppContext.js`**

```javascript
import auth from '@react-native-firebase/auth';

// Remplacer la fonction login mockée
const login = async (email, password) => {r
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;

    // Récupérer les données utilisateur depuis Firestore
    const userDoc = await firestore()
      .collection('users')
      .doc(firebaseUser.uid)
      .get();

    setUser(userDoc.data());
    setIsAuthenticated(true);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Fonction d'inscription
const signup = async (email, password, username) => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;

    // Créer document utilisateur dans Firestore
    await firestore().collection('users').doc(firebaseUser.uid).set({
      uid: firebaseUser.uid,
      email: email,
      username: username,
      xp: 0,
      level: 1,
      createdAt: firestore.FieldValue.serverTimestamp(),
      stats: {
        totalReports: 0,
        validatedReports: 0,
        totalVotes: 0,
        correctVotes: 0,
        streak: 0
      },
      preferences: {
        favoriteLines: [],
        notifications: true
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

**À faire :**
- ✅ Implémenter login/signup avec Firebase Auth
- ✅ Ajouter validation email (regex)
- ✅ Ajouter reset password
- ✅ Gérer les erreurs (email déjà utilisé, mot de passe faible, etc.)
- ✅ Persister la session (AsyncStorage)

**Temps** : 2 jours

---

## Phase 3 : CRUD Signalements (1 semaine)

### 3.1 Créer un signalement

**Fichier à modifier : `src/context/AppContext.js`**

```javascript
import firestore from '@react-native-firebase/firestore';

const createReport = async (reportData) => {
  try {
    const station = mockStations.find(s => s.id === reportData.stationId);

    const newReport = {
      type: reportData.type,
      stationId: reportData.stationId,
      stationName: station?.name || reportData.stationName,
      line: station?.line || reportData.line,
      coordinates: station?.coordinates || reportData.coordinates,
      createdAt: firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      authorId: user.uid,
      author: {
        username: user.username,
        level: user.level,
      },
      votes: {
        present: [user.uid], // L'auteur vote automatiquement
        absent: []
      },
      status: 'active',
      comment: reportData.comment || '',
    };

    // Ajouter à Firestore
    const docRef = await firestore().collection('reports').add(newReport);

    // Mettre à jour XP utilisateur
    await firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        xp: firestore.FieldValue.increment(10),
        'stats.totalReports': firestore.FieldValue.increment(1)
      });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 3.2 Lire les signalements (temps réel)

```javascript
import { useEffect } from 'react';

useEffect(() => {
  // Écouter les signalements en temps réel
  const unsubscribe = firestore()
    .collection('reports')
    .where('status', '==', 'active')
    .where('expiresAt', '>', new Date())
    .orderBy('expiresAt', 'desc')
    .onSnapshot(snapshot => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);
    });

  return () => unsubscribe();
}, []);
```

### 3.3 Voter sur un signalement

```javascript
const voteReport = async (reportId, voteType) => {
  try {
    const reportRef = firestore().collection('reports').doc(reportId);
    const voteField = voteType === 'present' ? 'votes.present' : 'votes.absent';

    // Ajouter l'UID de l'utilisateur au tableau de votes
    await reportRef.update({
      [voteField]: firestore.FieldValue.arrayUnion(user.uid)
    });

    // Créer document de vote
    await firestore().collection('votes').add({
      reportId: reportId,
      userId: user.uid,
      vote: voteType,
      timestamp: firestore.FieldValue.serverTimestamp()
    });

    // Mettre à jour XP
    await firestore()
      .collection('users')
      .doc(user.uid)
      .update({
        xp: firestore.FieldValue.increment(5),
        'stats.totalVotes': firestore.FieldValue.increment(1)
      });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 3.4 Tâche automatique : Expiration des signalements

**Option 1 : Cloud Function (Firebase)**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.expireReports = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    const snapshot = await admin.firestore()
      .collection('reports')
      .where('status', '==', 'active')
      .where('expiresAt', '<=', now)
      .get();

    const batch = admin.firestore().batch();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'expired' });
    });

    await batch.commit();
    return null;
  });
```

**Option 2 : Côté client (moins fiable)**
- Filtrer les signalements expirés dans `getFilteredReports()`

**Temps Phase 3** : 5-7 jours

---

## Phase 4 : Géolocalisation ✅ COMPLÉTÉE

> Cette phase est déjà implémentée dans l'application.

### Fonctionnalités implémentées :
- ✅ Expo Location installé et configuré
- ✅ Demande de permissions au démarrage
- ✅ Centrage automatique sur la position utilisateur
- ✅ Bouton "Ma position" pour recentrer
- ✅ Détection de la station la plus proche (formule Haversine)
- ✅ Suivi GPS en temps réel pendant la navigation
- ✅ Calcul de distances pour la progression

### Fichiers concernés :
- `src/screens/MapScreen.js` - Gestion location et carte
- `src/utils/routeCalculator.js` - Calculs de distance et itinéraires

**Temps** : ✅ Déjà fait

---

## Phase 5 : Notifications Push (3-5 jours)

### 5.1 Setup Firebase Cloud Messaging

```bash
npm install @react-native-firebase/messaging
```

### 5.2 Demander permissions

```javascript
import messaging from '@react-native-firebase/messaging';

const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();
    // Sauvegarder le token dans Firestore
    await firestore().collection('users').doc(user.uid).update({
      fcmToken: token
    });
  }
};
```

### 5.3 Cloud Function : Notifier les utilisateurs

```javascript
exports.notifyNearbyUsers = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const report = snap.data();

    // Récupérer utilisateurs avec ligne favorite
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('preferences.favoriteLines', 'array-contains', report.line)
      .get();

    const tokens = usersSnapshot.docs
      .map(doc => doc.data().fcmToken)
      .filter(token => token);

    if (tokens.length > 0) {
      await admin.messaging().sendMulticast({
        tokens: tokens,
        notification: {
          title: `🚨 ${report.type === 'controller' ? 'Contrôleur' : 'Incident'}`,
          body: `Ligne ${report.line} • ${report.stationName}`,
        },
        data: {
          reportId: context.params.reportId,
          type: 'new_report'
        }
      });
    }
  });
```

**Temps** : 3 jours

---

## Phase 6 : Améliorations UX (1 semaine)

### 6.1 Upload de photos (optionnel)

```bash
npm install expo-image-picker firebase-storage
```

### 6.2 Mode hors ligne

```javascript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sauvegarder localement
const saveOffline = async (reports) => {
  await AsyncStorage.setItem('offline_reports', JSON.stringify(reports));
};

// Charger en mode hors ligne
const loadOffline = async () => {
  const cached = await AsyncStorage.getItem('offline_reports');
  return cached ? JSON.parse(cached) : [];
};
```

### 6.3 Animations avancées

- Splash screen animé (déjà fait ✅)
- Skeleton loaders pendant chargement
- Animations de transition fluides

**Temps** : 5 jours

---

## Phase 7 : Tests & QA (1 semaine)

### 7.1 Tests unitaires

```bash
npm install --save-dev jest @testing-library/react-native
```

**Tester :**
- Fonctions helpers
- Calculs XP
- Validation formulaires
- Services Firebase

### 7.2 Tests d'intégration

- Flow complet : Signup → Login → Create Report → Vote → Logout
- Vérifier expiration signalements
- Tester mode hors ligne

### 7.3 Tests sur devices réels

- Android : 3-4 devices différents (Samsung, Pixel, etc.)
- iOS : iPhone (si possible)
- Tester performances, bugs, crashs

**Temps** : 5-7 jours

---

## Phase 8 : Déploiement (3-5 jours)

### 8.1 Build Android

```bash
# Générer APK
eas build --platform android --profile preview

# Ou pour Play Store
eas build --platform android --profile production
```

**Prérequis :**
- Compte Google Play Console (25$ one-time)
- Clés de signature
- Screenshots, description, icônes

### 8.2 Build iOS (optionnel)

```bash
eas build --platform ios --profile production
```

**Prérequis :**
- Compte Apple Developer (99$/an)
- Certificats, provisioning profiles
- Screenshots, description

### 8.3 Déploiement stores

**Google Play Store :**
- Internal testing → Closed testing → Open testing → Production
- Temps de review : 1-3 jours

**Apple App Store :**
- TestFlight → Production
- Temps de review : 1-7 jours

**Temps** : 3-5 jours (+ temps de review)

---

## Phase 9 : Post-lancement (ongoing)

### 9.1 Monitoring

```bash
npm install @sentry/react-native
```

**Configurer :**
- Crash reporting (Sentry)
- Analytics (Firebase Analytics)
- Performance monitoring

### 9.2 Feedback utilisateurs

- Formulaire in-app
- Rating prompt (après 3-5 utilisations)
- Support email

### 9.3 Itérations

- Corriger bugs reportés
- Ajouter features demandées
- Optimiser performances

---

## 💰 Budget estimé

### Développement
- **Votre temps** : 4-6 semaines (gratuit si vous le faites)
- **Développeur freelance** : 5000-15000€ (si externalisation)

### Infrastructure & Services
- **Firebase** : 0€/mois (jusqu'à 50k users) → 25-100€/mois ensuite
- **Google Maps API** : 200$/mois de crédit gratuit, puis ~7$/1000 requêtes
- **Serveur backend** (si custom) : 10-50€/mois
- **Domain name** : 10-15€/an
- **SSL Certificate** : Gratuit (Let's Encrypt)

### App Stores
- **Google Play** : 25$ (one-time)
- **Apple App Store** : 99$/an

### Marketing (optionnel)
- **Ads** : 500-2000€/mois
- **Influenceurs** : Variable
- **PR/Communication** : 1000-5000€

**Total minimum pour lancer** : ~150-200€
**Total avec marketing** : 2000-5000€ la première année

---

## 📊 Checklist complète

### Backend & Infrastructure
- [ ] Créer compte Firebase
- [ ] Configurer Authentication
- [ ] Créer base Firestore
- [ ] Définir règles de sécurité
- [ ] Setup Cloud Functions
- [ ] Configurer Firebase Storage (photos)

### Authentification
- [ ] Remplacer login mocké par Firebase Auth
- [ ] Ajouter signup
- [ ] Ajouter reset password
- [ ] Validation email/password
- [ ] Gestion erreurs
- [ ] Persistance session

### Signalements
- [ ] CRUD complet avec Firestore
- [ ] Écoute temps réel
- [ ] Système de votes
- [ ] Expiration automatique
- [ ] Upload photos (optionnel)

### Géolocalisation ✅
- [x] Demander permissions
- [x] Centrer carte sur user
- [x] Détecter station proche
- [x] Suivi GPS temps réel en navigation
- [x] Calcul de distances (Haversine)
- [ ] Filtrer signalements par distance

### Navigation & Itinéraires ✅
- [x] Recherche d'adresse avec autocomplétion
- [x] Cache des suggestions
- [x] Calcul d'itinéraire métro
- [x] Support des correspondances (1-2)
- [x] Affichage polylines sur carte
- [x] Preview compact / vue détaillée
- [x] Mode navigation avec suivi GPS
- [x] Indicateur de progression dynamique
- [x] Masquage des étapes complétées

### Notifications
- [ ] Setup Firebase Cloud Messaging
- [ ] Demander permissions
- [ ] Cloud Function notifications
- [ ] Gérer réception notifications

### UX/UI
- [x] Animations transitions (barre de recherche)
- [x] Splash screen
- [ ] Skeleton loaders
- [ ] Mode hors ligne
- [ ] Messages d'erreur clairs
- [ ] Feedback utilisateur

### Tests
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests sur devices réels
- [ ] Tests performances
- [ ] Beta testing (20-50 users)

### Déploiement
- [ ] Générer icônes/splash
- [ ] Screenshots stores
- [ ] Description app
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Build Android
- [ ] Build iOS
- [ ] Soumission stores

### Post-lancement
- [ ] Monitoring erreurs
- [ ] Analytics
- [ ] Support utilisateurs
- [ ] Updates régulières

---

## 🎯 Roadmap par priorité

### Priorité 1 - CRITIQUE (MVP minimum)
1. [ ] Firebase Auth
2. [ ] CRUD Signalements
3. [ ] Votes
4. [ ] Expiration automatique

### Priorité 2 - IMPORTANT (Partiellement complété)
5. ✅ Géolocalisation (complété)
6. ✅ Navigation & Itinéraires (complété)
7. [ ] Notifications push
8. [ ] Mode hors ligne basique

### Priorité 3 - NICE TO HAVE
9. Upload photos
10. Chat/commentaires
11. Statistiques avancées
12. Gamification poussée
13. Instructions vocales navigation

---

## 📚 Resources utiles

### Tutoriels
- [Firebase + React Native](https://rnfirebase.io/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

### Outils
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Firebase Console](https://console.firebase.google.com/)
- [Sentry](https://sentry.io/)

### Communautés
- [r/reactnative](https://reddit.com/r/reactnative)
- [Expo Discord](https://chat.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

**Dernière mise à jour** : 2025-11-22
**Version app** : 1.1.0 (MVP avec navigation GPS) → 2.0.0 (MVP fonctionnel avec backend)

### Changelog récent :
- **v1.1.0** : Ajout du système de navigation complet
  - Recherche d'adresse avec autocomplétion (Nominatim)
  - Calcul d'itinéraire métro avec correspondances
  - Mode navigation avec suivi GPS temps réel
  - Indicateur de progression dynamique
  - Vue étendue des étapes avec chevron toggle

Bon courage pour transformer votre vision en réalité ! 🚀
