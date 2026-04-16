# 📱 Guide de Déploiement Mobile — Djassa Marketplace

## Vue d'ensemble

Djassa est une application **hybride Capacitor** : le même code web (React) tourne dans un conteneur natif sur iOS et Android. **Aucune modification de design ou de fonctionnalité n'est nécessaire.**

### Architecture

```
┌─────────────────────────────┐
│      Code React (src/)       │
│   Design & logique inchangés │
└──────────┬──────────────────┘
           │ npm run build → dist/
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│  iOS   │  │ Android  │
│ Xcode  │  │ Android  │
│        │  │ Studio   │
└────────┘  └──────────┘
```

---

## Étape 1 : Exporter le code

1. Dans Lovable, cliquez sur **"Export to GitHub"**
2. Clonez le repo sur votre machine :

```bash
git clone https://github.com/VOTRE-USERNAME/djassa-marketplace.git
cd djassa-marketplace
```

**Pourquoi ?** Capacitor nécessite un environnement local avec Xcode (iOS) ou Android Studio (Android).

---

## Étape 2 : Installer les dépendances

```bash
npm install
```

Les packages Capacitor sont déjà dans `package.json` :
- `@capacitor/core` — Moteur Capacitor
- `@capacitor/ios` / `@capacitor/android` — Plateformes natives
- `@capacitor/haptics` — Vibrations
- `@capacitor/share` — Partage natif OS
- `@capacitor/network` — Détection online/offline
- `@capacitor/status-bar` — Barre d'état iOS/Android
- `@capacitor/splash-screen` — Écran de chargement
- `@capacitor/camera` — Accès caméra/galerie
- `@capacitor/app` — Bouton retour Android + Deep links

---

## Étape 3 : Build le projet web

```bash
npm run build
```

**Ce que ça fait :** Génère le dossier `dist/` contenant votre application web optimisée. C'est ce dossier que Capacitor embarque dans l'app native.

---

## Étape 4 : Ajouter les plateformes

### Android
```bash
npx cap add android
```

### iOS (Mac requis)
```bash
npx cap add ios
```

**Ce que ça fait :** Crée les dossiers `android/` et `ios/` avec les projets natifs complets.

---

## Étape 5 : Synchroniser

```bash
npx cap sync
```

**Ce que ça fait :** Copie `dist/` dans les projets natifs + installe les plugins Capacitor natifs. **À exécuter après chaque `npm run build`.**

---

## Étape 6 : Tester sur émulateur

### Android
```bash
npx cap run android
```
Nécessite : Android Studio installé avec un émulateur configuré.

### iOS
```bash
npx cap run ios
```
Nécessite : Mac + Xcode installé.

---

## 🤖 Publication Google Play Store

### Prérequis
- Compte Google Play Developer (25$ unique) : https://play.google.com/console

### 1. Configurer la signature

```bash
# Générer le keystore (à conserver précieusement !)
keytool -genkey -v -keystore djassa-release.keystore \
  -alias djassa -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurer `android/app/build.gradle`

Ajouter dans la section `android {}` :
```groovy
signingConfigs {
    release {
        storeFile file('djassa-release.keystore')
        storePassword 'VOTRE_MOT_DE_PASSE'
        keyAlias 'djassa'
        keyPassword 'VOTRE_MOT_DE_PASSE'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 3. Générer l'AAB (Android App Bundle)

```bash
cd android
./gradlew bundleRelease
```

Le fichier `.aab` sera dans `android/app/build/outputs/bundle/release/`.

### 4. Uploader sur Google Play Console

1. Créez une nouvelle application
2. Remplissez la fiche :
   - **Nom** : Djassa
   - **Description courte** : Marketplace locale africaine
   - **Catégorie** : Shopping
3. Uploadez le fichier `.aab`
4. Complétez le questionnaire Data Safety
5. Soumettez pour review

### Assets requis
- Icône : 512×512px (PNG)
- Feature graphic : 1024×500px
- Screenshots : minimum 2 (téléphone), format 16:9 ou 9:16

---

## 🍎 Publication Apple App Store

### Prérequis
- Mac avec Xcode
- Compte Apple Developer (99$/an) : https://developer.apple.com

### 1. Ouvrir dans Xcode

```bash
npx cap open ios
```

### 2. Configurer dans Xcode
- **Signing & Capabilities** → Sélectionnez votre Team
- **Bundle Identifier** → `tech.djassa.marketplace`
- Activez : Push Notifications, Background Modes > Remote notifications

### 3. Archiver et soumettre

1. **Product → Archive**
2. **Distribute App → App Store Connect**
3. Allez sur https://appstoreconnect.apple.com
4. Complétez la fiche :
   - **Nom** : Djassa
   - **Sous-titre** : Marketplace locale africaine
   - **Catégorie** : Shopping
5. Soumettez pour review

### Assets requis
- Icône : 1024×1024px (sans transparence)
- Screenshots iPhone 6.7" : 1290×2796px (minimum 3)
- Screenshots iPhone 6.5" : 1284×2778px (minimum 3)

---

## 🔁 Workflow quotidien

Quand vous modifiez l'app dans Lovable :

```bash
git pull                # Récupérer les changements
npm install             # Si nouvelles dépendances
npm run build           # Rebuild le web
npx cap sync            # Synchroniser avec les apps natives
npx cap run android     # Tester
```

---

## ⚠️ Points importants

### Mode développement (hot-reload)
Pour tester en temps réel sans rebuild, décommentez le bloc `server` dans `capacitor.config.ts` :
```typescript
server: {
  url: 'https://e593e2a1-db10-4fb9-8439-27ce2702d6a2.lovableproject.com?forceHideBadge=true',
  cleartext: true
},
```

### Mode production
**Le bloc `server` DOIT être commenté.** L'app charge alors les fichiers locaux depuis `dist/`, ce qui garantit :
- Fonctionnement hors ligne
- Performance optimale
- Pas de dépendance à un serveur externe

### App ID
L'identifiant de l'app est `tech.djassa.marketplace`. Il doit correspondre exactement dans :
- `capacitor.config.ts`
- Google Play Console
- Apple Developer Portal

---

## 📞 Ressources

| Ressource | Lien |
|-----------|------|
| Documentation Capacitor | https://capacitorjs.com/docs |
| Google Play Console | https://play.google.com/console |
| Apple Developer | https://developer.apple.com |
| Lovable Blog (Mobile) | https://lovable.dev/blogs/TODO |

---

## ✅ Checklist avant soumission

- [ ] Bloc `server` commenté dans `capacitor.config.ts`
- [ ] `npm run build` exécuté
- [ ] `npx cap sync` exécuté
- [ ] App testée sur émulateur iOS et Android
- [ ] Icônes et splash screen configurés
- [ ] Politique de confidentialité rédigée et hébergée
- [ ] Screenshots prêts pour les stores
- [ ] Compte développeur créé (Google/Apple)
