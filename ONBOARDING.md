# Onboarding - Tube App

Bienvenue sur **Tube**, l'application collaborative de signalement dans les transports en commun parisiens. Ce guide vous permet d'installer, comprendre et contribuer au projet en moins de 10 minutes.

---

## 1. Prerequis

| Outil | Version | Installation |
|-------|---------|-------------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| npm | v9+ | Inclus avec Node.js |
| Expo Go | Derniere version | App Store / Google Play |
| Git | v2+ | [git-scm.com](https://git-scm.com/) |

Optionnel :
- **Supabase CLI** : pour appliquer les migrations localement
- **EAS CLI** : `npm install -g eas-cli` (pour le build/deploy)

---

## 2. Installation rapide

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd Tube

# 2. Installer les dependances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Remplir les valeurs dans .env (demander les cles a l'equipe)

# 4. Lancer le serveur de developpement
npm start
```

Une fois le serveur lance :
1. Scanner le **QR code** affiche dans le terminal avec l'app **Expo Go** (Android) ou l'appareil photo (iOS)
2. L'app se lance sur votre smartphone
3. Creer un compte ou se connecter avec un compte existant

> **Note** : les cles Supabase de developpement sont deja configurees dans `src/config/supabase.js`. Le fichier `.env` est necessaire pour les cles Firebase et IDFM.

---

## 3. Architecture du projet

### Vue d'ensemble

```
Screens (UI)
    |
Components (UI reutilisable)
    |
Context (AppContext + ThemeContext)
    |
Services (logique metier)
    |
Supabase (PostgreSQL + Auth + RLS)
```

### Arborescence des dossiers

```
src/
  screens/          16 ecrans (AuthScreen, MapScreen, ProfileScreen, ...)
  components/       10 composants reutilisables (ReportCard, XPBar, ...)
  services/         10 services (authService, reportsService, friendsService, ...)
  context/          2 providers (AppContext, ThemeContext)
  config/           Configuration (supabase.js, firebase.js)
  data/             Donnees mockees (stations, reports)
  theme/            Design system (couleurs, niveaux XP)
  utils/            Fonctions utilitaires
  navigation/       Configuration React Navigation

supabase/
  migrations/       12 fichiers SQL de migration
  seed.js           Script de seed JavaScript
  seed_mock_data.sql  Donnees de test SQL
```

### Navigation

L'app utilise **React Navigation 6** avec deux stacks :

- **Auth Stack** (non connecte) : `AuthScreen`
- **Main Tabs** (connecte) :
  - **Carte** : `MapScreen` — carte interactive avec signalements
  - **Liste** : `ReportListScreen` — liste des signalements actifs
  - **Profil** : `ProfileScreen` — profil, XP, badges, parametres

Ecrans modaux supplementaires : `EditProfile`, `Friends`, `LiveShare`, `Leaderboard`, `FavoriteLines`, `FavoriteRoutes`, `NotificationSettings`, `EmergencyConfirm`.

### State management

| Context | Role | Hook |
|---------|------|------|
| `AppContext` | Auth, user, reports, notifications, amis, XP | `useApp()` |
| `ThemeContext` | Theme light/dark/system, couleurs | `useTheme()` |

Pas de Redux ni Zustand. Le projet utilise uniquement **React Context API**.

---

## 4. Base de donnees Supabase

### Tables principales

| Table | Description |
|-------|-------------|
| `users` | Profils utilisateurs (XP, level, badges, stats, preferences) |
| `reports` | Signalements avec coordonnees PostGIS, votes, remerciements |
| `friendships` | Relations d'amitie bidirectionnelles |
| `friend_requests` | Demandes d'amitie en attente |
| `share_permissions` | Permissions de partage de localisation par ami |
| `active_trips` | Trajets en direct avec itineraire |
| `trip_positions` | Historique GPS des trajets |
| `live_shares` | Sessions de partage live |
| `live_share_positions` | Positions des partages live |

### Appliquer les migrations

Les migrations sont dans `supabase/migrations/` et numerotees de `001` a `012` :

```bash
# Avec Supabase CLI (si configure)
supabase db push

# Ou manuellement : executer chaque fichier SQL dans l'ordre
# dans le SQL Editor de votre dashboard Supabase
```

### Seed des donnees de test

```bash
# Seed JavaScript (necessite SUPABASE_SERVICE_ROLE_KEY dans .env)
node supabase/seed.js

# Ou executer directement le SQL dans le dashboard Supabase :
# supabase/seed_mock_data.sql
```

### Securite RLS

Toutes les tables ont le **Row Level Security** (RLS) active. Les policies utilisent `auth.uid()` pour verifier l'identite de l'utilisateur. Regles importantes :
- Les utilisateurs ne peuvent modifier que leurs propres donnees
- Les signalements actifs sont visibles par tous les utilisateurs authentifies
- Les demandes d'amitie ne sont visibles que par l'expediteur et le destinataire

> **Ne jamais desactiver RLS en production.** Ne jamais utiliser la `service_role_key` cote client.

---

## 5. Tutoriel : developper une feature simple

**Objectif** : ajouter un bouton "Statistiques" sur le profil qui affiche le nombre total de signalements dans la base.

### Etape 1 — Creer la fonction dans le service

Ouvrir `src/services/reportsService.js` et ajouter :

```javascript
/**
 * Recuperer le nombre total de signalements dans la base
 */
export const getTotalReportsCount = async () => {
  try {
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return { success: true, count };
  } catch (error) {
    console.error('Erreur getTotalReportsCount:', error.message);
    return { success: false, error: error.message };
  }
};
```

### Etape 2 — Ajouter le bouton dans ProfileScreen

Ouvrir `src/screens/ProfileScreen.js` et ajouter :

1. Importer la fonction en haut du fichier :
```javascript
import { getTotalReportsCount } from '../services/reportsService';
```

2. Ajouter un state dans le composant :
```javascript
const [totalReports, setTotalReports] = useState(null);
```

3. Ajouter le bouton dans le JSX (dans la section profil) :
```javascript
<TouchableOpacity
  style={styles.menuItem}
  onPress={async () => {
    const result = await getTotalReportsCount();
    if (result.success) {
      Alert.alert('Statistiques', `Total signalements : ${result.count}`);
    } else {
      Alert.alert('Erreur', 'Impossible de charger les statistiques');
    }
  }}
>
  <MaterialCommunityIcons name="chart-bar" size={24} color={theme.colors.primary} />
  <Text style={styles.menuText}>Statistiques globales</Text>
  <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
</TouchableOpacity>
```

### Etape 3 — Tester

1. Sauvegarder les fichiers
2. L'app se recharge automatiquement sur Expo Go (hot reload)
3. Aller sur l'onglet **Profil**
4. Appuyer sur **Statistiques globales**
5. Une alerte affiche le nombre total de signalements

### Recapitulatif du pattern

```
Service (requete Supabase) --> Screen (appel du service) --> UI (affichage du resultat)
```

Ce pattern est le meme pour toutes les features de l'app.

---

## 6. Deployer ses modifications

### Commit & push

```bash
git add .
git commit -m "feat: description de la feature"
git push origin main
```

Conventions de commit : `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

### Build avec EAS

```bash
# Installer EAS CLI (si pas deja fait)
npm install -g eas-cli

# Build Android (preview)
eas build --platform android --profile preview

# Build iOS (preview)
eas build --platform ios --profile preview

# Build de production
eas build --platform android --profile production
```

### Publication OTA (over-the-air)

```bash
# Publier une mise a jour sans rebuild
eas update --branch production --message "description de la mise a jour"
```

---

## 7. Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm start` | Lancer le serveur Expo |
| `npm run android` | Lancer sur emulateur Android |
| `npm run ios` | Lancer sur simulateur iOS |
| `npm run web` | Lancer dans le navigateur |
| `node supabase/seed.js` | Injecter les donnees de test |
| `eas build --platform android --profile preview` | Build Android preview |
| `eas build --platform ios --profile preview` | Build iOS preview |
| `eas update` | Publication OTA |
| `npx expo install <package>` | Installer un package compatible Expo |
| `npx expo doctor` | Verifier la compatibilite des dependances |

---

## 8. Depannage

### "Unable to resolve module" au lancement

```bash
# Vider le cache et relancer
npx expo start --clear
```

### L'app ne se connecte pas a Supabase

- Verifier que les cles dans `src/config/supabase.js` sont correctes
- Verifier la connexion internet du smartphone
- Verifier que le smartphone et le PC sont sur le meme reseau Wi-Fi

### Le QR code ne fonctionne pas

- Verifier qu'Expo Go est bien installe et a jour
- Essayer le mode tunnel : `npx expo start --tunnel`
- Sur Android, scanner avec l'app Expo Go directement (pas l'appareil photo)

### Erreur "Request failed with status code 401" (Supabase)

- L'utilisateur n'est pas authentifie ou le token a expire
- Verifier que RLS est correctement configure pour la table concernee
- Verifier les policies dans le dashboard Supabase

### Les dependances ne s'installent pas

```bash
# Supprimer node_modules et reinstaller
rm -rf node_modules
npm install

# Si probleme de version Expo
npx expo install --fix
```

### Hot reload ne fonctionne pas

- Secouer le telephone pour ouvrir le menu dev Expo
- Verifier que "Fast Refresh" est active
- Relancer avec `npx expo start --clear`

---

## Ressources

- [Documentation Expo](https://docs.expo.dev/)
- [Documentation Supabase](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- `.cursorrules` — Conventions de code du projet
- `docs/` — Documentation technique detaillee
