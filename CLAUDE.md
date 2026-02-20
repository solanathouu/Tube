# Tube - Guide Projet

## Description
Application mobile communautaire (React Native + Expo SDK 54) de signalement en temps reel pour les transports parisiens. Backend Supabase (Auth + PostgreSQL + PostGIS).

## Current Project State

| Aspect | Status | Details |
|--------|--------|---------|
| Code | ✅ Done | MVP v1.0.0 complet, 16 ecrans, 10+ services |
| Config | ✅ Securise | Toutes les cles migrees vers .env (process.env) |
| Backend | ✅ Done | 12 migrations SQL, RLS, PostGIS |
| Docs | ✅ Done | README, ONBOARDING, docs/ par feature |
| GitHub | ✅ Public | https://github.com/solanathouu/Tube (repo propre, sans historique sensible) |
| Tests | ❌ Aucun | Pas de tests automatises |

## Architecture Cles

```
src/
  config/supabase.js    # Client Supabase (env vars)
  config/firebase.js    # Config Firebase (env vars)
  services/             # Couche API (auth, reports, friends, idfm, notifications...)
  context/AppContext.js  # State global (auth, reports, user, location)
  context/ThemeContext.js # Theme clair/sombre
  screens/              # 16 ecrans (Map, Auth, Profil, Amis, Leaderboard...)
  components/           # ReportCard, ReportMarker, XPBar, FilterBar...
  data/mockStations.js  # 302 stations metro Paris avec GPS
  theme/theme.js        # Design system, couleurs lignes metro, niveaux XP
```

## Variables d'Environnement (.env)

Voir `.env.example` pour la liste complete. Cles requises :
- `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_IDFM_API_KEY`
- `EXPO_PUBLIC_FIREBASE_*` (7 variables)

Les scripts `supabase/seed.js` et `supabase/delete_mock_reports.js` utilisent `dotenv`.

## Conventions

- Services retournent `{ success: boolean, data?, error? }`
- Styles dynamiques via `getStyles(theme)` + `useMemo`
- State global via `useApp()` et `useTheme()`
- Pas de TypeScript, JavaScript uniquement

## Next Immediate Action

Le MVP est publie. Prochaines etapes possibles :
1. **Regenerer toutes les cles API** (Supabase, Firebase, IDFM) - les anciennes ont ete exposees dans l'ancien historique git
2. Ajouter des tests (Jest + React Native Testing Library)
3. Configurer EAS Build pour les builds natifs
4. Ajouter des screenshots dans le README
