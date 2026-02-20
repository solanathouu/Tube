-- ============================================
-- MIGRATION : PARTAGE DE TRAJET EN LIVE
-- Permet de partager sa position en temps réel avec des contacts
-- ============================================

-- Table principale pour les sessions de partage
CREATE TABLE IF NOT EXISTS live_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL, -- Token public pour accéder au partage
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  destination_name TEXT, -- Nom de la destination (ex: "Gare du Nord")
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  eta_seconds INTEGER, -- Temps estimé d'arrivée en secondes
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  auto_shared BOOLEAN DEFAULT false, -- Si partagé automatiquement via alarme
  emergency_contact_ids TEXT[], -- IDs des contacts favoris pour urgence
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour les positions enregistrées
CREATE TABLE IF NOT EXISTS live_share_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES live_shares(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2), -- Précision GPS en mètres
  heading DECIMAL(5, 2), -- Direction en degrés (0-360)
  speed DECIMAL(6, 2), -- Vitesse en m/s
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_live_shares_user_id ON live_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_live_shares_token ON live_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_live_shares_status ON live_shares(status);
CREATE INDEX IF NOT EXISTS idx_live_share_positions_share_id ON live_share_positions(share_id);
CREATE INDEX IF NOT EXISTS idx_live_share_positions_timestamp ON live_share_positions(timestamp DESC);

-- Fonction pour générer un token unique
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Génère un token aléatoire de 32 caractères
  token := encode(gen_random_bytes(16), 'base64');
  token := replace(replace(token, '/', '_'), '+', '-');
  token := substring(token from 1 for 32);
  
  -- Vérifie l'unicité
  WHILE EXISTS (SELECT 1 FROM live_shares WHERE share_token = token) LOOP
    token := encode(gen_random_bytes(16), 'base64');
    token := replace(replace(token, '/', '_'), '+', '-');
    token := substring(token from 1 for 32);
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_live_shares_updated_at
  BEFORE UPDATE ON live_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE live_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_share_positions ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut voir ses propres partages
CREATE POLICY "users_view_own_shares"
  ON live_shares FOR SELECT
  USING (auth.uid() = user_id);

-- L'utilisateur peut créer ses propres partages
CREATE POLICY "users_create_own_shares"
  ON live_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- L'utilisateur peut modifier ses propres partages
CREATE POLICY "users_update_own_shares"
  ON live_shares FOR UPDATE
  USING (auth.uid() = user_id);

-- Lecture publique par token (pour la page web publique)
CREATE POLICY "public_read_by_token"
  ON live_shares FOR SELECT
  USING (true); -- Le token sera vérifié dans l'application

-- Positions : l'utilisateur peut voir les positions de ses partages
CREATE POLICY "users_view_own_positions"
  ON live_share_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_shares 
      WHERE live_shares.id = live_share_positions.share_id 
      AND live_shares.user_id = auth.uid()
    )
  );

-- Positions : l'utilisateur peut créer des positions pour ses partages
CREATE POLICY "users_create_own_positions"
  ON live_share_positions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM live_shares 
      WHERE live_shares.id = live_share_positions.share_id 
      AND live_shares.user_id = auth.uid()
    )
  );

-- Lecture publique des positions par token (pour la page web)
CREATE POLICY "public_read_positions_by_token"
  ON live_share_positions FOR SELECT
  USING (true); -- Le token sera vérifié dans l'application

-- Fonction pour obtenir les dernières positions d'un partage (optimisée)
CREATE OR REPLACE FUNCTION get_latest_positions(p_share_token TEXT, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(8, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(6, 2),
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lsp.id,
    lsp.latitude,
    lsp.longitude,
    lsp.accuracy,
    lsp.heading,
    lsp.speed,
    lsp.timestamp AS recorded_at
  FROM live_share_positions lsp
  INNER JOIN live_shares ls ON ls.id = lsp.share_id
  WHERE ls.share_token = p_share_token
    AND ls.status = 'active'
  ORDER BY lsp.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les infos d'un partage par token
CREATE OR REPLACE FUNCTION get_share_info(p_share_token TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status TEXT,
  destination_name TEXT,
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  eta_seconds INTEGER,
  started_at TIMESTAMPTZ,
  auto_shared BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.user_id,
    ls.status,
    ls.destination_name,
    ls.destination_lat,
    ls.destination_lng,
    ls.eta_seconds,
    ls.started_at,
    ls.auto_shared
  FROM live_shares ls
  WHERE ls.share_token = p_share_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

