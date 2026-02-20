# Résolution de problèmes

Guide de dépannage pour les problèmes courants.

---

## Problèmes de démarrage

### "Cannot find module" ou erreur de dépendances
```bash
rm -rf node_modules
npm install
npx expo start -c
```

### "Metro bundler timeout"
C'est normal au premier démarrage. Patientez 1-2 minutes jusqu'à voir le QR code.

### "Port 8081 already in use"
```bash
npx expo start --port 8082
```

Ou tuez le processus existant :
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

---

## Problèmes Expo Go

### QR code ne fonctionne pas
1. Vérifiez que téléphone et PC sont sur le même WiFi
2. Essayez le mode tunnel : `npx expo start --tunnel`
3. Android : utilisez le scanner dans Expo Go
4. iOS : utilisez l'app Appareil Photo native

### App ne se charge pas
1. Vérifiez que Expo Go est à jour
2. Redémarrez Expo Go
3. Tapez `r` dans le terminal pour recharger
4. Fermez et rouvrez Expo Go

### Carte ne s'affiche pas sur iOS
Normal dans Expo Go sur iOS. Solutions :
- Utiliser un appareil Android
- Utiliser l'émulateur Android
- Build natif iOS (hors MVP)

---

## Problèmes API

### Erreurs API IDFM
- Vérifiez votre connexion internet
- L'API PRIM peut avoir des ralentissements
- Les perturbations se rafraîchissent toutes les 2 minutes

---

## Réinitialisation complète

Si rien ne fonctionne :
```bash
rm -rf node_modules
rm package-lock.json
npm install
npx expo start -c
```

---

## Raccourcis clavier (pendant que Expo tourne)

| Touche | Action |
|--------|--------|
| `r` | Recharger l'app |
| `a` | Ouvrir sur Android |
| `i` | Ouvrir sur iOS |
| `w` | Ouvrir dans le navigateur |
| `m` | Toggle menu |

---

## Ressources externes

- [Documentation Expo](https://docs.expo.dev)
- [Forum Expo](https://forums.expo.dev)
- [Troubleshooting Expo](https://docs.expo.dev/troubleshooting/overview/)
