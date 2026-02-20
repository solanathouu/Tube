# Démarrage rapide

Lancez l'application Tube en 5 minutes.

---

## Prérequis

- **Node.js** v18+ : `node --version`
- **npm** : `npm --version`
- **Expo Go** sur votre smartphone :
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Installation (3 étapes)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Lancer le serveur
```bash
npx expo start
```

### 3. Scanner le QR code
- **iPhone** : App Appareil Photo native
- **Android** : App Expo Go

---

## Connexion

L'authentification est mockée pour le MVP :
```
Email : demo@tube.app (ou n'importe quoi)
Mot de passe : password (ou n'importe quoi)
```

---

## Commandes utiles

```bash
npx expo start           # Démarrer normalement
npx expo start -c        # Démarrer avec cache vidé
npx expo start --tunnel  # Mode tunnel (problèmes réseau)
npx expo start --android # Émulateur Android
npx expo start --ios     # Simulateur iOS
```

---

## Que faire après la connexion ?

1. **Explorer la carte** - Visualisez les signalements sur Paris
2. **Voir les perturbations** - Barre rouge/orange en haut = perturbations IDFM
3. **Calculer un itinéraire** - Bouton en bas de la carte
4. **Créer un signalement** - Bouton + bleu
5. **Consulter votre profil** - Onglet Profil

---

## Problèmes ?

Voir [troubleshooting.md](troubleshooting.md)
