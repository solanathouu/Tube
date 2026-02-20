# Authentification

Système d'authentification via Supabase Auth.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `src/services/authService.js` | Service d'authentification |
| `src/config/supabase.js` | Configuration client Supabase |
| `src/screens/AuthScreen.js` | Interface connexion/inscription |
| `src/screens/SplashScreen.js` | Vérification session |
| `src/context/AppContext.js` | État authentification |

---

## Fonctionnalités

### Inscription
```javascript
const { success, user, error } = await signup(email, password, username);
```

1. Création compte Supabase Auth
2. Validation du username (unicité)
3. Création profil dans table `users`
4. Retour du token de session

### Connexion
```javascript
const { success, user, error } = await login(email, password);
```

1. Authentification Supabase
2. Récupération du profil utilisateur
3. Mise à jour du contexte

### Déconnexion
```javascript
await logout();
```

1. Suppression session Supabase
2. Nettoyage du contexte
3. Redirection vers AuthScreen

### Écoute de session
```javascript
authService.onAuthStateChange((user) => {
  if (user) {
    // Utilisateur connecté
  } else {
    // Utilisateur déconnecté
  }
});
```

---

## Configuration Supabase

```javascript
// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## Flux d'authentification

```
App Start
    ↓
SplashScreen
    ↓
Check Session (supabase.auth.getSession())
    ↓
┌───────────────────┬───────────────────┐
│   Session valide  │  Pas de session   │
│        ↓          │        ↓          │
│   MainStack       │   AuthScreen      │
│   (Map, etc.)     │   (Login/Signup)  │
└───────────────────┴───────────────────┘
```

---

## Validation

### Email
- Format email valide
- Unicité dans Supabase Auth

### Password
- Minimum 6 caractères (configurable Supabase)

### Username
- Minimum 3 caractères
- Unicité dans table `users`
- Caractères alphanumériques + underscore

---

## Gestion des erreurs

| Code | Message | Action |
|------|---------|--------|
| `invalid_credentials` | Email ou mot de passe incorrect | Afficher erreur |
| `user_already_exists` | Email déjà utilisé | Proposer connexion |
| `username_taken` | Username déjà pris | Suggérer alternative |
| `weak_password` | Mot de passe trop faible | Afficher critères |

---

## Sécurité

### Row Level Security (RLS)
- Les utilisateurs ne peuvent lire que leur propre profil complet
- Les autres utilisateurs voient uniquement les infos publiques
- Modification uniquement de son propre profil

### Tokens
- JWT géré automatiquement par Supabase
- Refresh automatique avant expiration
- Stockage sécurisé (SecureStore sur mobile)

---

## Mode démo (MVP)

Pour le MVP, l'authentification accepte n'importe quel email/password :
```
Email : demo@tube.app (ou autre)
Password : password (ou autre)
```

En production, retirer le mode démo et utiliser l'auth réelle.
