# 📱 Checklist Publication App Store & Google Play

## Prérequis Généraux

### ✅ Configuration Capacitor (Déjà fait)
- [x] `capacitor.config.ts` configuré avec appId unique
- [x] WebView pointant vers `https://djassa.tech`
- [x] Support des notifications push configuré
- [x] Splash screen configuré
- [x] Status bar configuré
- [x] Gestion du mode hors ligne

### ✅ Optimisations Mobile (Implémentées)
- [x] Viewport configuré avec `viewport-fit=cover`
- [x] Safe areas iOS gérées (notch, bottom bar)
- [x] Touch targets ≥ 44px (Apple Human Interface Guidelines)
- [x] Pas de zoom automatique sur les inputs (font-size: 16px)
- [x] Navigation bottom bar native
- [x] Transitions d'écrans fluides
- [x] Pull-to-refresh natif
- [x] Haptic feedback supporté
- [x] Animations GPU-accélérées
- [x] PWA manifest.json

---

## 🍎 Apple App Store (iOS)

### Étape 1: Compte Développeur Apple
- [ ] Créer un compte Apple Developer ($99/an)
- [ ] Activer l'App Store Connect

### Étape 2: Certificats et Provisioning
- [ ] Créer un certificat de distribution iOS
- [ ] Créer un App ID pour `app.lovable.e593e2a1db104fb9843927ce2702d6a2`
- [ ] Créer un Provisioning Profile de distribution
- [ ] Configurer les Push Notifications (APNs)

### Étape 3: Préparation Xcode
```bash
# Cloner le projet depuis GitHub
git clone <votre-repo>
cd <votre-repo>

# Installer les dépendances
npm install

# Ajouter la plateforme iOS
npx cap add ios

# Build et sync
npm run build
npx cap sync ios

# Ouvrir dans Xcode
npx cap open ios
```

### Étape 4: Configuration Xcode
- [ ] Sélectionner votre Team dans Signing & Capabilities
- [ ] Activer "Push Notifications" capability
- [ ] Activer "Background Modes" > Remote notifications
- [ ] Vérifier le Bundle Identifier

### Étape 5: Assets App Store
- [ ] Icône de l'app (1024x1024px, sans transparence)
- [ ] Screenshots iPhone 6.7" (1290x2796px) - minimum 3
- [ ] Screenshots iPhone 6.5" (1284x2778px) - minimum 3
- [ ] Screenshots iPad Pro 12.9" (2048x2732px) - si supporté
- [ ] Preview vidéo (optionnel, 15-30 sec)

### Étape 6: Métadonnées App Store Connect
- [ ] Nom de l'app: "Djassa Marketplace"
- [ ] Sous-titre: "Achat & Vente en Côte d'Ivoire"
- [ ] Description (max 4000 caractères)
- [ ] Mots-clés (max 100 caractères)
- [ ] Catégorie: Shopping
- [ ] URL de support: https://djassa.tech
- [ ] URL de politique de confidentialité
- [ ] URL des CGU

### Étape 7: Build et Soumission
```bash
# Archive dans Xcode
Product > Archive

# Uploader vers App Store Connect
Distribute App > App Store Connect
```

### Étape 8: App Review
- [ ] Fournir un compte de test (acheteur + vendeur)
- [ ] Notes pour les reviewers
- [ ] Délai moyen: 24-48h

---

## 🤖 Google Play Store (Android)

### Étape 1: Compte Développeur Google
- [ ] Créer un compte Google Play Developer ($25 unique)
- [ ] Vérifier l'identité

### Étape 2: Préparation Android
```bash
# Ajouter la plateforme Android
npx cap add android

# Build et sync
npm run build
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

### Étape 3: Configuration Android Studio
- [ ] Configurer le signing key (release keystore)
- [ ] Mettre à jour `build.gradle` avec vos credentials
- [ ] Activer Firebase Cloud Messaging (FCM) pour les push

### Étape 4: Générer l'APK/AAB
```bash
# Dans Android Studio
Build > Generate Signed Bundle/APK
# Choisir Android App Bundle (.aab) pour le Play Store
```

### Étape 5: Assets Google Play
- [ ] Icône haute résolution (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshots phone (min 2, max 8)
- [ ] Screenshots tablet 7" (optionnel)
- [ ] Screenshots tablet 10" (optionnel)
- [ ] Vidéo promotionnelle YouTube (optionnel)

### Étape 6: Fiche Play Store
- [ ] Titre: "Djassa Marketplace" (max 30 caractères)
- [ ] Description courte (max 80 caractères)
- [ ] Description complète (max 4000 caractères)
- [ ] Catégorie: Shopping
- [ ] Tags de contenu
- [ ] Coordonnées développeur

### Étape 7: Configuration Politique
- [ ] Déclaration de confidentialité
- [ ] Questionnaire Data Safety
- [ ] Classification de contenu (IARC)
- [ ] Pays de distribution

### Étape 8: Release
- [ ] Internal testing (équipe)
- [ ] Closed testing (beta testeurs)
- [ ] Open testing (public beta)
- [ ] Production release

---

## 📋 Conformité & Guidelines

### Apple Guidelines Essentielles
- [ ] L'app doit offrir de la valeur sans WebView pure
- [ ] Pas de références à d'autres plateformes de paiement dans l'app
- [ ] Notifications push pertinentes et opt-in
- [ ] Pas de tracking sans consentement (ATT)
- [ ] Politique de confidentialité accessible

### Google Play Policies Essentielles
- [ ] Déclaration Data Safety complète
- [ ] Pas de pratiques de facturation trompeuses
- [ ] Contenu approprié (pas de contenu pour adultes)
- [ ] Permissions justifiées

---

## 🔔 Configuration Push Notifications

### iOS (APNs)
1. [ ] Créer une clé APNs dans Apple Developer
2. [ ] Télécharger le fichier .p8
3. [ ] Configurer dans Supabase/Backend
4. [ ] Key ID et Team ID requis

### Android (FCM)
1. [ ] Créer un projet Firebase
2. [ ] Ajouter l'app Android
3. [ ] Télécharger google-services.json
4. [ ] Placer dans `android/app/`
5. [ ] Configurer la clé serveur FCM dans le backend

---

## 🧪 Tests Avant Soumission

- [ ] Tester sur iPhone (différentes tailles d'écran)
- [ ] Tester sur iPad (si supporté)
- [ ] Tester sur Android (différents fabricants)
- [ ] Tester les notifications push
- [ ] Tester le mode hors ligne
- [ ] Tester les deep links
- [ ] Tester le flux d'achat complet
- [ ] Tester le flux de vente complet
- [ ] Tester l'authentification
- [ ] Vérifier les performances (pas de lag)

---

## 📞 Support & Ressources

- **Documentation Capacitor**: https://capacitorjs.com/docs
- **Apple Developer**: https://developer.apple.com
- **Google Play Console**: https://play.google.com/console
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policy**: https://play.google.com/about/developer-content-policy/

---

## ⏱ Délais Estimés

| Étape | iOS | Android |
|-------|-----|---------|
| Configuration compte | 1-2 jours | 1 jour |
| Préparation assets | 1-2 jours | 1-2 jours |
| Build & configuration | 1 jour | 1 jour |
| Review | 24-48h | 1-7 jours |
| **Total** | **4-7 jours** | **4-10 jours** |
