# Système social

Gestion des amis, contacts et partage de trajet en temps réel.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/screens/FriendsScreen.js` | Gestion des amis (3 onglets) |
| `src/screens/LiveShareScreen.js` | Partage de trajet |
| `src/screens/EmergencyConfirmScreen.js` | Confirmation alerte urgence |
| `src/screens/EmergencyAlertSentScreen.js` | Confirmation envoi |
| `src/services/friendsService.js` | Gestion des relations |
| `src/services/contactsService.js` | Import contacts téléphone |
| `src/services/liveShareService.js` | Partage en temps réel |
| `src/services/locationTrackingService.js` | Suivi GPS |

---

## Amis (FriendsScreen)

### 3 onglets

| Onglet | Contenu |
|--------|---------|
| **Amis** | Liste des amis avec statut de trajet actif |
| **Demandes** | Demandes reçues + envoyées en attente |
| **Recherche** | Recherche d'utilisateurs + import contacts |

### Ajouter un ami
1. Onglet "Recherche"
2. Entrer username, email ou téléphone
3. Cliquer sur "Ajouter"
4. La demande est envoyée

### Accepter/Refuser une demande
1. Onglet "Demandes"
2. Voir les demandes reçues
3. Accepter ✓ ou Refuser ✗

### Recherche multi-critères
- Par username (pseudo)
- Par email
- Par numéro de téléphone

---

## Import de contacts

### Fonctionnement
1. Cliquer sur "Importer contacts"
2. Autoriser l'accès aux contacts
3. L'app compare les numéros/emails
4. Affiche les contacts qui ont l'app

### Permissions requises
- `Contacts` : Lecture des contacts téléphone

---

## Partage de trajet (LiveShare)

### Démarrer un partage
1. Écran LiveShareScreen
2. Définir destination (optionnel)
3. Définir ETA (optionnel)
4. Cliquer "Démarrer"
5. Un lien partageable est généré

### Informations partagées
- Position GPS en temps réel
- Destination (si définie)
- Heure d'arrivée estimée
- Statut (en cours / terminé)

### Arrêter le partage
- Bouton "Arrêter" sur l'écran
- Automatique si l'app est fermée (configurable)

---

## Alerte d'urgence

### Fonctionnement
1. Bouton d'urgence sur MapScreen
2. Écran de confirmation avec compte à rebours
3. Si confirmé → alerte envoyée aux contacts d'urgence
4. Position partagée automatiquement

### Données envoyées
- Position GPS actuelle
- Timestamp de l'alerte
- Identité de l'utilisateur

---

## Structure des données

### Demande d'ami
```javascript
{
  id: 'uuid',
  sender_id: 'user-uuid',
  recipient_id: 'user-uuid',
  message: 'Salut, on se croise souvent sur la ligne 4 !',
  status: 'pending', // pending, accepted, rejected
  created_at: '2025-01-28T10:00:00Z'
}
```

### Amitié
```javascript
{
  id: 'uuid',
  user_id: 'user-uuid',
  friend_id: 'friend-uuid',
  status: 'active',
  created_at: '2025-01-28T10:00:00Z'
}
```

### Partage de trajet
```javascript
{
  id: 'uuid',
  user_id: 'user-uuid',
  share_token: 'abc123xyz',
  destination_name: 'Gare de Lyon',
  destination_lat: 48.8443,
  destination_lng: 2.3734,
  eta_seconds: 1800,
  auto_shared: false,
  status: 'active',
  created_at: '2025-01-28T10:00:00Z'
}
```

---

## Fonctions PostgreSQL

Voir [backend/base-de-donnees/](../../backend/base-de-donnees/) pour :
- `accept_friend_request()` : Acceptation atomique
- `search_users_by_username()` : Recherche multi-critères
