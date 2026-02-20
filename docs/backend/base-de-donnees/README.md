# Base de données

Schéma PostgreSQL avec Supabase, migrations et fonctions.

---

## Fichiers source

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/*.sql` | Migrations SQL |
| `supabase/seed.js` | Script de seed |
| `src/config/supabase.js` | Client Supabase |

---

## Tables

### users
Profils utilisateurs avec gamification.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  profile_picture_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_reports INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### reports
Signalements avec géolocalisation PostGIS.

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- controller, incident, maintenance, works
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  line TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326),
  author_id UUID REFERENCES users(id),
  author_username TEXT,
  author_level INTEGER,
  comment TEXT,
  votes_present UUID[] DEFAULT '{}',
  votes_absent UUID[] DEFAULT '{}',
  thanks UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes'
);
```

### friend_requests
Demandes d'amitié en attente.

```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### friendships
Relations d'amitié bidirectionnelles.

```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
```

### share_permissions
Permissions de partage de localisation.

```sql
CREATE TABLE share_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  can_see_location BOOLEAN DEFAULT false,
  can_see_trips BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
```

### active_trips
Trajets en cours avec partage.

```sql
CREATE TABLE active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  share_token TEXT UNIQUE,
  destination_name TEXT,
  destination_lat FLOAT,
  destination_lng FLOAT,
  eta_seconds INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stopped_at TIMESTAMPTZ
);
```

### trip_positions
Historique des positions GPS.

```sql
CREATE TABLE trip_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES active_trips(id),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Fonctions PostgreSQL

### accept_friend_request(p_request_id UUID)

Accepte une demande d'ami de manière atomique.

```sql
SELECT accept_friend_request('123e4567-e89b-12d3-a456-426614174000');
-- Retourne: TRUE ou FALSE
```

**Actions** :
1. Vérifie que l'utilisateur est le destinataire
2. Met à jour le statut de la demande
3. Crée les relations d'amitié bidirectionnelles
4. Crée les permissions de partage par défaut

### search_users_by_username(p_query TEXT, p_limit INTEGER)

Recherche des utilisateurs par pseudo/email/téléphone.

```sql
SELECT * FROM search_users_by_username('paris', 10);
-- Retourne: user_id, username, email, is_friend, has_pending_request
```

**Caractéristiques** :
- Recherche insensible à la casse (ILIKE)
- Exclut l'utilisateur courant
- Indique le statut d'amitié

---

## Row Level Security (RLS)

Toutes les tables ont RLS activé.

```sql
-- Exemple pour users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lecture publique des infos basiques
CREATE POLICY "Public read" ON users
  FOR SELECT USING (true);

-- Modification de son propre profil uniquement
CREATE POLICY "Update own" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

## Index

```sql
-- Performance des requêtes
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_line ON reports(line);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_geo ON reports USING GIST(coordinates);
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_username ON users(username);
```

---

## Migrations

### Exécuter une migration
1. Dashboard Supabase → SQL Editor
2. Copier le contenu du fichier `.sql`
3. Exécuter

### Fichiers de migration
```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_friends_system.sql
├── 003_live_sharing.sql
└── ...
```

---

## Seed des données

```bash
node supabase/seed.js
```

Crée :
- 4 utilisateurs de test
- 14 signalements de démonstration
- Relations d'amitié de test

### Utilisateurs de test

| Username | Niveau | XP |
|----------|--------|-----|
| Metro_Watcher | 4 (Platine) | 4,120 |
| TechSupport | 4 (Platine) | 5,200 |
| Parisien_92 | 3 (Or) | 2,450 |
| CityGuardian | 4 (Platine) | 4,450 |

---

## Expiration automatique

```sql
-- Fonction d'expiration
CREATE OR REPLACE FUNCTION expire_old_reports()
RETURNS void AS $$
BEGIN
  UPDATE reports
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Planification (pg_cron)
SELECT cron.schedule(
  'expire-old-reports',
  '* * * * *',
  'SELECT expire_old_reports();'
);
```
