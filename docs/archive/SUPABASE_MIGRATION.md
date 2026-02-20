# Migration Firebase → Supabase - Résumé

## ✅ Étapes Complétées

### 1. Installation et Configuration
- ✅ `@supabase/supabase-js` installé
- ✅ Fichier de configuration `src/config/supabase.js` créé
- ✅ URL et clé API anon configurées

### 2. Schéma de Base de Données
- ✅ Fichier SQL de migration créé : `supabase/migrations/001_initial_schema.sql`
- ✅ Tables définies :
  - `users` : profils utilisateurs, XP, niveaux, stats, badges
  - `reports` : signalements avec géolocalisation PostGIS
- ✅ Row Level Security (RLS) configuré
- ✅ Indexes de performance ajoutés
- ✅ Triggers et fonctions automatiques

### 3. Services Migrés
- ✅ **authService.js** : Auth Firebase → Supabase Auth
  - signup, login, logout
  - resetPassword
  - getCurrentUser (maintenant async)
  - onAuthStateChange (nouveau)

- ✅ **reportsService.js** : Firestore → Supabase
  - createReport, getActiveReports
  - subscribeToReports (utilise maintenant Supabase Realtime)
  - voteOnReport, deleteReport
  - thankReport, expireOldReports

- ✅ **usersService.js** : Firestore → Supabase
  - getUser, updateUserProfile
  - addXP, addFavoriteLine, removeFavoriteLine
  - unlockAchievement, getLeaderboard
  - checkAndUnlockAchievements

- ✅ **AppContext.js** : Mise à jour pour Supabase Auth
  - getCurrentUser est maintenant async
  - Listener d'authentification Supabase ajouté
  - Gestion des user IDs (Firebase uid → Supabase id)

## 🚧 Prochaines Étapes

### Étape 1 : Exécuter la Migration SQL
1. Ouvrir le Dashboard Supabase : https://app.supabase.com
2. Selectionner votre projet Supabase
3. Aller dans **SQL Editor**
4. Cliquer sur **New query**
5. Copier tout le contenu de `supabase/migrations/001_initial_schema.sql`
6. Coller et cliquer sur **Run**
7. Vérifier dans **Table Editor** que les tables `users` et `reports` sont créées

### Étape 2 : Tester l'Application
**Note** : Le Realtime Supabase n'est pas nécessaire. L'app utilise le **polling** (rafraîchissement automatique toutes les 10 secondes) pour la synchronisation.
1. **Supprimer les anciennes données** de l'app :
   - Sur iOS : Supprimer l'app et réinstaller
   - Sur Android : Clear app data

2. **Tester l'inscription** :
   - Créer un nouveau compte
   - Vérifier que l'utilisateur apparaît dans Supabase Table Editor → users

3. **Tester la connexion** :
   - Se déconnecter
   - Se reconnecter avec le même compte

4. **Tester un signalement** :
   - Créer un signalement
   - Vérifier dans Supabase Table Editor → reports
   - Vérifier que la géolocalisation est correcte (colonne coordinates)

5. **Tester le temps réel** (CRUCIAL) :
   - Ouvrir l'app sur 2 appareils/émulateurs
   - Se connecter avec 2 comptes différents
   - Créer un signalement sur l'appareil 1
   - Vérifier qu'il apparaît immédiatement sur l'appareil 2

6. **Tester les votes** :
   - Cliquer sur un signalement
   - Voter "Là" ou "Pas là"
   - Vérifier que le vote est enregistré
   - Vérifier que les XP sont mis à jour

## 📋 Différences Importantes Firebase vs Supabase

### 1. IDs Utilisateurs
- **Firebase** : `uid` (string)
- **Supabase** : `id` (UUID)
- ⚠️ Le code utilise maintenant `user.id` pour Supabase mais garde `uid` dans l'objet user pour compatibilité

### 2. Timestamps
- **Firebase** : Objet `Timestamp` avec méthode `.toDate()`
- **Supabase** : String ISO 8601 (ex: "2025-01-15T10:30:00Z")
- ⚠️ Utilisez `new Date(timestamp)` pour convertir

### 3. Géolocalisation
- **Firebase** : Objet `{ latitude: number, longitude: number }`
- **Supabase** : PostGIS `POINT(longitude latitude)` (notez l'ordre inversé!)
- ⚠️ La fonction `parseCoordinates()` dans reportsService gère la conversion

### 4. Arrays
- **Firebase** : `arrayUnion()`, `arrayRemove()`
- **Supabase** : Manipulation directe des arrays PostgreSQL
- ⚠️ Le code lit l'array, le modifie, et le réécrit

### 5. Real-time
- **Firebase** : `onSnapshot()` sur une query
- **Supabase** : Polling avec `setInterval()` toutes les 10 secondes (pas besoin d'activer Realtime)
- ⚠️ Le polling recharge tous les signalements actifs toutes les 10 secondes

## 🔧 Configuration Supplémentaire (Optionnel)

### Auto-Expiration des Signalements
Pour que les signalements expirent automatiquement après 10 minutes :

```sql
-- Dans Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-old-reports',
  '* * * * *', -- Chaque minute
  'SELECT expire_old_reports();'
);
```

## 🐛 Debug

### Vérifier les logs de polling
Dans le code, les console.log suivants sont actifs :
- `🔄 [subscribeToReports] Initialisation du polling...`
- `📥 [subscribeToReports] Chargement initial: X signalements`
- `🔄 [subscribeToReports] Polling - Signalements récupérés: X` (toutes les 10s)

### Problèmes Communs

**Les signalements n'apparaissent pas**
- Les signalements se rafraîchissent toutes les 10 secondes (polling)
- Vérifier les logs dans Metro bundler : vous devriez voir `🔄 Polling - Signalements récupérés`
- Vérifier que RLS permet la lecture des reports

**Erreur "coordinates must be a valid GEOGRAPHY"**
- Vérifier que le format est `POINT(longitude latitude)`
- Notez l'ordre : longitude PUIS latitude

**Erreur "user not found in database"**
- Vérifier que l'utilisateur a bien été créé dans la table `users` lors du signup
- Vérifier les RLS policies

## 📊 Monitoring

Dans le Dashboard Supabase :
- **Table Editor** : Voir les données en temps réel
- **SQL Editor** : Exécuter des requêtes custom
- **Logs** : Voir les erreurs et requêtes
- **API Docs** : Documentation auto-générée de votre API

## 🎉 Avantages de Supabase

1. **Vraie base PostgreSQL** : Requêtes SQL complètes, transactions ACID
2. **PostGIS intégré** : Requêtes géospatiales avancées
3. **Row Level Security** : Sécurité au niveau des lignes
4. **Realtime natif** : Basé sur PostgreSQL LISTEN/NOTIFY
5. **Auto-scaling** : Gère automatiquement la charge
6. **Gratuit jusqu'à** : 500 MB database, 2 GB file storage, 50,000 MAU

## 🔗 Ressources

- Documentation Supabase : https://supabase.com/docs
- Supabase Auth : https://supabase.com/docs/guides/auth
- Supabase Realtime : https://supabase.com/docs/guides/realtime
- PostGIS : https://postgis.net/documentation/
