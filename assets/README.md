# 🎨 Génération des icônes pour Tube

Ce guide vous aide à créer rapidement les icônes nécessaires pour l'application.

## 📋 Icônes requises

Vous devez créer 3 fichiers :

1. **icon.png** (1024x1024) - Icône de l'app
2. **splash.png** (1242x2436 ou 1024x1024) - Écran de démarrage
3. **adaptive-icon.png** (1024x1024) - Icône Android adaptative

## 🎨 Design recommandé

### Style
- **Fond** : Bleu métro (#2196F3)
- **Logo** : Lettre "T" blanche et bold
- **Style** : Minimaliste, moderne

### Dimensions de la lettre T
- Taille : ~70% de la hauteur du canvas
- Font : Arial Black, Helvetica Bold, ou similaire
- Couleur : Blanc (#FFFFFF)
- Centré verticalement et horizontalement

## 🚀 Méthodes de création

### Méthode 1 : Outil en ligne (RAPIDE - 5 minutes)

#### Option A : Canva (gratuit)
1. Allez sur [canva.com](https://canva.com)
2. Créez un design personnalisé 1024x1024
3. Ajoutez un carré de fond #2196F3
4. Ajoutez un texte "T" en blanc, Arial Black, taille ~700
5. Centrez le "T"
6. Téléchargez en PNG
7. Renommez en `icon.png`
8. Dupliquez pour `splash.png` et `adaptive-icon.png`

#### Option B : Figma (gratuit)
1. Créez un nouveau fichier
2. Frame 1024x1024
3. Rectangle de fond #2196F3
4. Texte "T" en blanc, bold, taille ~700
5. Exportez en PNG @1x
6. Renommez les fichiers

#### Option C : Générateur d'icônes
1. Allez sur [appicon.co](https://appicon.co)
2. Uploadez une image simple (T blanc sur fond bleu)
3. Générez toutes les tailles
4. Téléchargez le pack
5. Gardez uniquement icon.png (1024x1024)

### Méthode 2 : Photoshop/GIMP (15 minutes)

1. **Nouveau document**
   - Taille : 1024x1024 pixels
   - Résolution : 72 DPI
   - Mode couleur : RVB

2. **Fond**
   - Remplir avec #2196F3

3. **Texte**
   - Outil Texte (T)
   - Taper "T"
   - Police : Arial Black ou Helvetica Bold
   - Taille : ~700px
   - Couleur : #FFFFFF
   - Centrer horizontalement et verticalement

4. **Export**
   - Fichier > Exporter > PNG
   - Qualité : Maximum
   - Enregistrer sous `icon.png`

5. **Dupliquer**
   - Copier vers `splash.png`
   - Copier vers `adaptive-icon.png`

### Méthode 3 : Code (Python - pour développeurs)

```python
from PIL import Image, ImageDraw, ImageFont

# Créer image
img = Image.new('RGB', (1024, 1024), color='#2196F3')
draw = ImageDraw.Draw(img)

# Ajouter texte (nécessite une police bold)
font = ImageFont.truetype("Arial-Bold.ttf", 700)
text = "T"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
position = ((1024 - text_width) / 2, (1024 - text_height) / 2)
draw.text(position, text, fill='#FFFFFF', font=font)

# Sauvegarder
img.save('icon.png')
img.save('splash.png')
img.save('adaptive-icon.png')
```

## 📂 Placement des fichiers

Une fois créés, placez les fichiers ici :

```
tube-app/
└── assets/
    ├── icon.png            ← 1024x1024
    ├── splash.png          ← 1024x1024 ou 1242x2436
    └── adaptive-icon.png   ← 1024x1024
```

## ✅ Vérification

Après avoir créé les icônes :

1. **Vérifier les tailles**
   ```bash
   # Windows
   dir assets

   # macOS/Linux
   ls -lh assets
   ```

2. **Tester dans Expo**
   ```bash
   npx expo start
   ```

3. **Vérifier dans l'app**
   - L'icône devrait apparaître dans Expo Go
   - Le splash screen devrait s'afficher au démarrage

## 🎨 Variantes possibles

### Design alternatif 1 : T stylisé
- Utilisez une police moderne (Montserrat Bold, Futura)
- Ajoutez un léger effet de profondeur

### Design alternatif 2 : Pictogramme métro
- Ajoutez un cercle autour du T
- Style panneau de métro parisien

### Design alternatif 3 : Gradient
- Fond en dégradé bleu (#2196F3 → #1976D2)
- Plus moderne

## 🚨 Problèmes courants

### "Cannot find icon.png"
- Vérifiez que le fichier est bien dans `assets/`
- Vérifiez l'orthographe exacte
- Redémarrez Expo : `npx expo start -c`

### Icône floue
- Assurez-vous que la résolution est bien 1024x1024
- Exportez en qualité maximale
- Pas de compression JPG, utilisez PNG

### Icône trop petite/grande
- Le "T" doit occuper ~70% de la hauteur
- Ajustez la taille de police

## 📱 Dimensions détaillées

### iOS
- App Store : 1024x1024 (icon.png)
- iPhone : 180x180, 120x120, 80x80 (générées auto)
- iPad : 167x167, 152x152 (générées auto)

### Android
- Play Store : 512x512 (généré auto depuis adaptive-icon.png)
- Diverses densités : générées automatiquement

Expo génère automatiquement toutes les tailles à partir de vos fichiers 1024x1024.

## 🎓 Ressources

- [Expo Icon Guidelines](https://docs.expo.dev/guides/app-icons/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)

## ⚡ Solution ultra-rapide (30 secondes)

Si vous voulez juste tester l'app sans vous soucier du design :

1. Créez un carré bleu 1024x1024 sur Paint/Preview
2. Écrivez "T" en blanc au centre
3. Sauvegardez 3 fois avec les 3 noms
4. Terminé !

L'app fonctionnera parfaitement même avec des icônes basiques.

---

**Note** : Ces icônes sont pour le MVP. Pour la production, engagez un designer pour des icônes professionnelles.
