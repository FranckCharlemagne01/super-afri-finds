# Guide de Publication iOS App Store - Djassa Marketplace

## Configuration actuelle

L'application Djassa Marketplace est configurée pour fonctionner comme une WebView iOS native chargant `https://djassa.tech`.

### Fonctionnalités natives incluses

1. **Push Notifications iOS (APNs)**
   - Support complet des notifications push via Apple Push Notification service
   - Les notifications existantes du web sont compatibles

2. **Splash Screen natif**
   - Écran de chargement animé avec le logo Djassa
   - Transition fluide vers l'application

3. **Mode hors ligne**
   - Détection automatique de la connectivité
   - Écran d'erreur élégant avec bouton "Réessayer"

4. **Status Bar iOS**
   - Style adapté au design de l'application
   - Support des Safe Areas pour iPhone avec notch

## Prérequis

- Mac avec Xcode 14+ installé
- Compte Apple Developer ($99/an)
- Node.js 18+
- Git

## Étapes de configuration

### 1. Exporter vers GitHub

1. Cliquez sur "Export to GitHub" dans Lovable
2. Clonez le repo sur votre Mac :
   ```bash
   git clone https://github.com/votre-username/djassa-marketplace.git
   cd djassa-marketplace
   ```

### 2. Installation des dépendances

```bash
npm install
```

### 3. Ajouter la plateforme iOS

```bash
npx cap add ios
```

### 4. Build et synchronisation

```bash
npm run build
npx cap sync ios
```

### 5. Configuration Xcode

Ouvrez le projet iOS :
```bash
npx cap open ios
```

Dans Xcode :

1. **Signing & Capabilities**
   - Sélectionnez votre Team Apple Developer
   - Configurez le Bundle Identifier : `app.lovable.e593e2a1db104fb9843927ce2702d6a2`

2. **Push Notifications**
   - Cliquez sur "+ Capability" > "Push Notifications"
   - Activez "Background Modes" > "Remote notifications"

3. **App Transport Security**
   - Déjà configuré pour HTTPS uniquement (djassa.tech)

4. **Info.plist**
   Ajoutez les descriptions requises :
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>Djassa a besoin d'accéder à votre caméra pour prendre des photos de produits</string>
   
   <key>NSPhotoLibraryUsageDescription</key>
   <string>Djassa a besoin d'accéder à vos photos pour sélectionner des images de produits</string>
   ```

### 6. Configuration des Push Notifications

1. Créez une clé APNs dans Apple Developer Portal
2. Téléchargez le fichier `.p8`
3. Configurez Supabase avec la clé APNs :
   - Allez dans Supabase Dashboard > Settings > Push Notifications
   - Uploadez votre clé APNs

### 7. Splash Screen

Le splash screen est configuré automatiquement. Pour personnaliser :

1. Remplacez les images dans `ios/App/App/Assets.xcassets/Splash.imageset/`
2. Modifiez `ios/App/App/Base.lproj/LaunchScreen.storyboard`

### 8. Build pour App Store

1. Dans Xcode, sélectionnez "Any iOS Device (arm64)"
2. Product > Archive
3. Distribuez vers App Store Connect

## Guidelines Apple à respecter

### ✅ Ce qui est conforme

- WebView chargeant votre propre contenu (djassa.tech)
- Fonctionnalités natives (push, camera, network)
- UI responsive adaptée à iOS
- HTTPS uniquement
- Gestion du mode hors ligne

### ⚠️ Points d'attention

- L'app doit offrir une valeur ajoutée par rapport au site web
- Les achats in-app physiques ne nécessitent pas Apple Pay
- Les push notifications doivent être opt-in

## Dépannage

### L'app ne charge pas
- Vérifiez que `https://djassa.tech` est accessible
- Vérifiez la configuration réseau iOS

### Push notifications ne fonctionnent pas
- Vérifiez la configuration APNs
- Testez sur un appareil physique (pas simulateur)

### Rejet App Store
Raisons courantes :
- Description insuffisante des fonctionnalités
- Captures d'écran manquantes
- Bugs lors de la review

## Commandes utiles

```bash
# Mettre à jour après changements
npx cap sync ios

# Ouvrir dans Xcode
npx cap open ios

# Logs en temps réel
npx cap run ios --target=<device-id>
```

## Support

Pour toute question, consultez :
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Lovable Documentation](https://docs.lovable.dev/)
