-- ============================================
-- MIGRATION : SYSTÈME SOCIAL D'AMIS & PARTAGE
-- Réseau d'amis/famille avec permissions de localisation
-- ============================================

-- Table des relations d'amitié
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Table des demandes d'amitié
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sender_id, recipient_id),
  CHECK (sender_id != recipient_id)
);

-- Table des permissions de partage
CREATE TABLE IF NOT EXISTS share_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_see_location BOOLEAN DEFAULT false,
  can_see_trips BOOLEAN DEFAULT false,
  always_share BOOLEAN DEFAULT false, -- Partage permanent
  notify_on_trip_start BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Table des trajets actifs (remplace live_shares)
CREATE TABLE IF NOT EXISTS active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_type TEXT NOT NULL DEFAULT 'navigation' CHECK (trip_type IN ('navigation', 'emergency', 'manual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  
  -- Origine et destination
  origin_name TEXT,
  origin_lat DECIMAL(10, 8),
  origin_lng DECIMAL(11, 8),
  destination_name TEXT NOT NULL,
  destination_lat DECIMAL(10, 8) NOT NULL,
  destination_lng DECIMAL(11, 8) NOT NULL,
  
  -- Itinéraire (stocké en JSON depuis l'API IDFM)
  route_data JSONB,
  
  -- Temps et durée
  estimated_duration_seconds INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Partage
  share_token TEXT UNIQUE,
  shared_with_friend_ids UUID[], -- Liste des IDs d'amis avec qui le trajet est partagé
  auto_shared BOOLEAN DEFAULT false, -- Si partagé automatiquement (urgence)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des positions de trajet (optimisée)
CREATE TABLE IF NOT EXISTS trip_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(6, 2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient ON friend_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

CREATE INDEX IF NOT EXISTS idx_share_permissions_user ON share_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_share_permissions_friend ON share_permissions(friend_id);

CREATE INDEX IF NOT EXISTS idx_active_trips_user ON active_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_active_trips_status ON active_trips(status);
CREATE INDEX IF NOT EXISTS idx_active_trips_token ON active_trips(share_token);

CREATE INDEX IF NOT EXISTS idx_trip_positions_trip ON trip_positions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_positions_timestamp ON trip_positions(timestamp DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_share_permissions_updated_at
  BEFORE UPDATE ON share_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_active_trips_updated_at
  BEFORE UPDATE ON active_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_positions ENABLE ROW LEVEL SECURITY;

-- Friendships : voir ses propres relations
CREATE POLICY "users_view_own_friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "users_create_own_friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests : voir demandes envoyées/reçues
CREATE POLICY "users_view_own_requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "users_send_requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "users_update_own_requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Share permissions : gérer ses propres permissions
CREATE POLICY "users_view_permissions"
  ON share_permissions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "users_create_permissions"
  ON share_permissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_permissions"
  ON share_permissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_permissions"
  ON share_permissions FOR DELETE
  USING (auth.uid() = user_id);

-- Active trips : voir ses trajets + trajets partagés
CREATE POLICY "users_view_own_trips"
  ON active_trips FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with_friend_ids)
  );

CREATE POLICY "users_create_own_trips"
  ON active_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_trips"
  ON active_trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_trips"
  ON active_trips FOR DELETE
  USING (auth.uid() = user_id);

-- Trip positions : voir positions des trajets accessibles
CREATE POLICY "users_view_trip_positions"
  ON trip_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM active_trips
      WHERE active_trips.id = trip_positions.trip_id
      AND (
        active_trips.user_id = auth.uid() OR
        auth.uid() = ANY(active_trips.shared_with_friend_ids)
      )
    )
  );

CREATE POLICY "users_create_trip_positions"
  ON trip_positions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM active_trips
      WHERE active_trips.id = trip_positions.trip_id
      AND active_trips.user_id = auth.uid()
    )
  );

-- Fonctions helper

-- Accepter une demande d'ami
CREATE OR REPLACE FUNCTION accept_friend_request(p_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_id UUID;
  v_recipient_id UUID;
BEGIN
  -- Récupérer les IDs
  SELECT sender_id, recipient_id INTO v_sender_id, v_recipient_id
  FROM friend_requests
  WHERE id = p_request_id AND recipient_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Mettre à jour la demande
  UPDATE friend_requests
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_request_id;

  -- Créer les deux relations d'amitié (bidirectionnelle)
  INSERT INTO friendships (user_id, friend_id, status)
  VALUES
    (v_sender_id, v_recipient_id, 'active'),
    (v_recipient_id, v_sender_id, 'active')
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  -- Créer les permissions par défaut (pas de partage auto)
  INSERT INTO share_permissions (user_id, friend_id, can_see_location, can_see_trips)
  VALUES
    (v_sender_id, v_recipient_id, false, false),
    (v_recipient_id, v_sender_id, false, false)
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir la liste des amis avec statut de partage
CREATE OR REPLACE FUNCTION get_friends_with_status(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  username TEXT,
  email TEXT,
  can_see_my_location BOOLEAN,
  can_see_my_trips BOOLEAN,
  can_see_their_location BOOLEAN,
  can_see_their_trips BOOLEAN,
  active_trip_id UUID,
  active_trip_destination TEXT,
  last_position_lat DECIMAL(10, 8),
  last_position_lng DECIMAL(11, 8),
  last_position_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.friend_id,
    u.username,
    u.email,
    COALESCE(sp1.can_see_location, false) AS can_see_my_location,
    COALESCE(sp1.can_see_trips, false) AS can_see_my_trips,
    COALESCE(sp2.can_see_location, false) AS can_see_their_location,
    COALESCE(sp2.can_see_trips, false) AS can_see_their_trips,
    at.id AS active_trip_id,
    at.destination_name AS active_trip_destination,
    tp.latitude AS last_position_lat,
    tp.longitude AS last_position_lng,
    tp.timestamp AS last_position_time
  FROM friendships f
  INNER JOIN users u ON u.id = f.friend_id
  LEFT JOIN share_permissions sp1 ON sp1.user_id = p_user_id AND sp1.friend_id = f.friend_id
  LEFT JOIN share_permissions sp2 ON sp2.user_id = f.friend_id AND sp2.friend_id = p_user_id
  LEFT JOIN active_trips at ON at.user_id = f.friend_id AND at.status = 'active'
  LEFT JOIN LATERAL (
    SELECT latitude, longitude, timestamp
    FROM trip_positions
    WHERE trip_id = at.id
    ORDER BY timestamp DESC
    LIMIT 1
  ) tp ON true
  WHERE f.user_id = p_user_id AND f.status = 'active'
  AND (sp2.can_see_location = true OR sp2.can_see_trips = true)
  ORDER BY u.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter phone_number à la table users si pas déjà présent
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='phone_number') THEN
    ALTER TABLE users ADD COLUMN phone_number TEXT UNIQUE;
  END IF;
END $$;

-- Rechercher des utilisateurs par pseudo, email ou téléphone
CREATE OR REPLACE FUNCTION search_users_by_username(p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT,
  phone_number TEXT,
  is_friend BOOLEAN,
  has_pending_request BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.phone_number,
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = auth.uid() AND friend_id = u.id)
      OR (user_id = u.id AND friend_id = auth.uid())
    ) AS is_friend,
    EXISTS (
      SELECT 1 FROM friend_requests
      WHERE sender_id = auth.uid() AND recipient_id = u.id AND status = 'pending'
    ) AS has_pending_request
  FROM users u
  WHERE u.id != auth.uid()
  AND (
    u.username ILIKE '%' || p_query || '%'
    OR u.email ILIKE '%' || p_query || '%'
    OR u.phone_number ILIKE '%' || p_query || '%'
  )
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

