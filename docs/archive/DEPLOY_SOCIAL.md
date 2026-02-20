# Déploiement du système social

## Modifications apportées

### 1. Base de données (Supabase)
- **Migration `009_social_friends_system.sql`** : Système complet d'amis et de partage
  - Tables : `friendships`, `friend_requests`, `share_permissions`, `active_trips`, `trip_positions`
  - Fonctions RPC : `accept_friend_request`, `get_friends_with_status`, `search_users_by_username`
  - RLS configuré pour la sécurité

### 2. Services
- **`friendsService.js`** : Gestion complète des amis
  - Demandes d'ami (envoyer/accepter/refuser/annuler)
  - Recherche d'utilisateurs
  - Permissions de partage par contact
  
- **`tripSharingService.js`** : Partage de trajets avec itinéraire
  - Démarrer/terminer un trajet
  - Partager avec des amis spécifiques
  - Mise à jour position en temps réel
  - Abonnement Realtime aux positions

### 3. Interface
- **`FriendsScreen.js`** : Écran de gestion des contacts
  - Onglet Amis : liste avec statut de trajet actif
  - Onglet Demandes : reçues et envoyées
  - Onglet Recherche : trouver des utilisateurs
  
- **Navigation** : Ajout de l'écran Friends
- **ProfileScreen** : Bouton "Mes contacts" ajouté

### 4. Fonctionnalités principales

#### Réseau d'amis
- Rechercher des utilisateurs par pseudo
- Envoyer/accepter/refuser des demandes d'ami
- Voir la liste de ses amis
- Retirer un ami

#### Permissions de partage
- Configurer qui peut voir ma position
- Configurer qui peut voir mes trajets
- Partage permanent ou temporaire
- Notifications de début de trajet

#### Partage de trajets
- Démarrer un trajet avec itinéraire (de l'API IDFM)
- Partager automatiquement avec contacts favoris
- Partager manuellement avec amis choisis
- Mise à jour position temps réel
- Voir les trajets des amis (si partagés)

## Déploiement

### Étape 1 : Migration SQL
```sql
-- Exécuter dans l'éditeur SQL Supabase
-- Copier/coller le contenu de supabase/migrations/009_social_friends_system.sql
```

### Étape 2 : Test des fonctionnalités
1. Créer 2 comptes utilisateurs
2. Rechercher un utilisateur
3. Envoyer une demande d'ami
4. Accepter la demande
5. Configurer les permissions de partage
6. Démarrer un trajet et le partager
7. Vérifier que l'ami voit le trajet

### Étape 3 : Intégration avec l'itinéraire existant
Le service `tripSharingService` stocke l'itinéraire complet de l'API IDFM dans `route_data` (JSONB).
Quand l'utilisateur calcule un itinéraire dans MapScreen, il peut :
- Démarrer le partage automatiquement
- Choisir avec qui partager
- Voir ses amis qui sont en trajet

## TODO (optionnel)
- [ ] Afficher positions amis sur carte
- [ ] Bouton "Rejoindre" pour calculer itinéraire vers un ami
- [ ] Améliorer UI perturbations (style Citymapper)
- [ ] Notifications push pour demandes d'ami
- [ ] Notifications push pour début de trajet partagé

## Notes
- Le système fonctionne en build standalone (pas seulement Expo Go)
- Les positions sont mises à jour toutes les 10 secondes
- Le suivi fonctionne en arrière-plan (avec permissions)
- Les permissions sont granulaires par ami
- Le partage peut être permanent ou temporaire

