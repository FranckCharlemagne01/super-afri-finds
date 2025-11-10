# Configuration de l'Authentification Google OAuth pour Djassa

## 📋 Guide de Configuration

L'authentification Google OAuth a été ajoutée à votre application Djassa. Suivez ces étapes pour activer complètement cette fonctionnalité.

---

## 🔧 Étape 1 : Configuration dans Google Cloud Console

### 1.1 Créer un Projet Google Cloud (si nécessaire)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur **"Sélectionner un projet"** → **"Nouveau projet"**
3. Nommez votre projet : **"Djassa OAuth"**
4. Cliquez sur **"Créer"**

### 1.2 Configurer l'écran de consentement OAuth

1. Dans le menu latéral, allez dans **"API et services"** → **"Écran de consentement OAuth"**
2. Sélectionnez **"Externe"** (pour permettre à tous les utilisateurs Gmail de se connecter)
3. Cliquez sur **"Créer"**

4. **Remplissez les informations requises** :
   - **Nom de l'application** : `Djassa`
   - **Email d'assistance utilisateur** : Votre email
   - **Logo de l'application** : (optionnel, vous pouvez ajouter votre logo)
   - **Domaine de l'application** : `https://djassa.djassa.tech`
   - **Domaine autorisé** : 
     - `djassa.tech`
     - `zqskpspbyzptzjcoitwt.supabase.co` (domaine Supabase)
   - **Email de contact du développeur** : Votre email

5. **Configurer les scopes (autorisations)** :
   - Cliquez sur **"Ajouter ou supprimer des champs d'application"**
   - Ajoutez ces 3 scopes **obligatoires** :
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Cliquez sur **"Enregistrer et continuer"**

6. Cliquez sur **"Enregistrer et continuer"** jusqu'à la fin

### 1.3 Créer les identifiants OAuth 2.0

1. Dans le menu latéral, allez dans **"API et services"** → **"Identifiants"**
2. Cliquez sur **"+ Créer des identifiants"** → **"ID client OAuth 2.0"**
3. **Type d'application** : Sélectionnez **"Application Web"**

4. **Configuration** :
   - **Nom** : `Djassa Web Client`
   
   - **Origines JavaScript autorisées** (cliquez sur "+ Ajouter une URI") :
     - `https://djassa.djassa.tech`
     - `http://localhost:5173` (pour le développement local)
     - `http://localhost:3000` (si vous utilisez un autre port)
   
   - **URI de redirection autorisés** (IMPORTANT !) :
     - `https://zqskpspbyzptzjcoitwt.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback` (pour le développement)
     - `https://djassa.djassa.tech/auth/callback` (pour la production)

5. Cliquez sur **"Créer"**

6. **IMPORTANT** : Une fenêtre s'affiche avec vos identifiants :
   - **ID client** : `xxxxx.apps.googleusercontent.com`
   - **Code secret du client** : `GOCSPX-xxxxx`
   
   ⚠️ **Copiez ces deux valeurs immédiatement** - vous en aurez besoin à l'étape suivante !

---

## 🔐 Étape 2 : Configuration dans Supabase

### 2.1 Activer Google comme fournisseur d'authentification

1. Allez sur votre [Dashboard Supabase](https://supabase.com/dashboard/project/zqskpspbyzptzjcoitwt)
2. Dans le menu latéral, cliquez sur **"Authentication"** → **"Providers"**
3. Trouvez **"Google"** dans la liste et cliquez dessus

4. **Activez Google OAuth** :
   - Basculez le switch **"Enable Sign in with Google"** sur **ON** ✅
   
5. **Entrez vos identifiants Google** :
   - **Client ID (for OAuth)** : Collez l'ID client copié depuis Google Cloud
   - **Client Secret (for OAuth)** : Collez le code secret copié depuis Google Cloud

6. Cliquez sur **"Save"** en bas de la page

### 2.2 Configurer les URLs de redirection dans Supabase

1. Toujours dans **"Authentication"**, cliquez sur **"URL Configuration"**

2. **Site URL** : 
   - `https://djassa.djassa.tech`

3. **Redirect URLs** (ajoutez ces URLs une par une) :
   - `https://djassa.djassa.tech/**`
   - `https://djassa.djassa.tech/auth/callback`
   - `http://localhost:5173/**` (pour le développement)
   - `http://localhost:5173/auth/callback` (pour le développement)

4. Cliquez sur **"Save"**

---

## ✅ Étape 3 : Vérification et Tests

### 3.1 Tests sur Desktop

1. Ouvrez votre application : `https://djassa.djassa.tech/auth`
2. Vous devriez voir le bouton **"Continuer avec Google"** avec le logo Google
3. Cliquez sur le bouton
4. Une popup Google devrait s'ouvrir
5. Sélectionnez votre compte Google
6. Acceptez les autorisations demandées
7. Vous devriez être redirigé vers Djassa, connecté automatiquement

### 3.2 Tests sur Mobile (Android/iOS)

1. Ouvrez Safari (iOS) ou Chrome (Android)
2. Allez sur `https://djassa.djassa.tech/auth`
3. Cliquez sur **"Continuer avec Google"**
4. Le navigateur devrait ouvrir la page de connexion Google
5. Connectez-vous avec votre compte Gmail
6. Vous devriez être redirigé vers l'application

### 3.3 Vérifier la création automatique du profil

1. Après connexion avec Google, vérifiez dans Supabase :
   - Allez dans **"Table Editor"** → Table **"profiles"**
   - Vous devriez voir un nouveau profil créé avec :
     - `email` : L'email Gmail de l'utilisateur
     - `full_name` : Le nom complet depuis Google
     - `email_verified` : `true` (vérifié automatiquement)

---

## 🚨 Dépannage : Erreurs Courantes

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URI de redirection configurée dans Google Cloud ne correspond pas à celle utilisée par Supabase.

**Solution** :
1. Vérifiez que dans Google Cloud Console → Identifiants, vous avez bien ajouté :
   ```
   https://zqskpspbyzptzjcoitwt.supabase.co/auth/v1/callback
   ```
2. Attendez 5-10 minutes pour que les changements se propagent
3. Essayez à nouveau

### Erreur : "Access blocked: This app's request is invalid"

**Cause** : Les scopes OAuth ne sont pas correctement configurés.

**Solution** :
1. Retournez dans Google Cloud Console → Écran de consentement OAuth
2. Vérifiez que les 3 scopes obligatoires sont bien présents :
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

### Erreur : "unauthorized_client"

**Cause** : Le Client ID ou le Client Secret dans Supabase ne sont pas corrects.

**Solution** :
1. Retournez dans Google Cloud Console → Identifiants
2. Cliquez sur votre ID client OAuth 2.0
3. Re-copiez le **Client ID** et le **Client secret**
4. Retournez dans Supabase → Authentication → Providers → Google
5. Remplacez par les nouvelles valeurs
6. Cliquez sur **Save**

### Le profil n'est pas créé automatiquement

**Cause** : Le trigger `handle_new_user()` pourrait avoir un problème.

**Solution** :
1. Vérifiez dans Supabase → SQL Editor que le trigger existe :
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Le trigger devrait créer automatiquement le profil avec les données Google
3. Si le problème persiste, vérifiez les logs dans Supabase → Logs → Auth Logs

### Connexion Google fonctionne mais redirection échoue

**Cause** : Les URLs de redirection dans Supabase ne sont pas correctement configurées.

**Solution** :
1. Supabase → Authentication → URL Configuration
2. Vérifiez que vous avez bien :
   - Site URL : `https://djassa.djassa.tech`
   - Redirect URLs : 
     - `https://djassa.djassa.tech/**`
     - `https://djassa.djassa.tech/auth/callback`

---

## 📱 Considérations pour Mobile (iOS/Android)

### Configuration spécifique iOS

Pour iOS, l'authentification Google fonctionne via Safari. Aucune configuration supplémentaire n'est nécessaire, mais assurez-vous que :

1. L'URL de redirection commence bien par `https://` (pas `http://`)
2. Les cookies tiers sont autorisés dans Safari

### Configuration spécifique Android

Pour Android, l'authentification fonctionne via Chrome ou le navigateur système. Assurez-vous que :

1. Les URLs de redirection sont bien configurées avec `https://`
2. Le domaine `djassa.tech` est bien ajouté dans les domaines autorisés de Google Cloud

---

## ✨ Fonctionnalités Implémentées

### ✅ Ce qui fonctionne déjà :

1. **Bouton Google OAuth** :
   - Design moderne avec logo officiel Google
   - Responsive (mobile, tablette, desktop)
   - Texte adapté : "Continuer avec Google" (connexion) ou "S'inscrire avec Google" (inscription)

2. **Création automatique du profil** :
   - Trigger `handle_new_user()` crée automatiquement le profil
   - Email marqué comme vérifié (pas besoin de confirmation)
   - Nom complet extrait depuis Google
   - Rôle par défaut : "buyer" (peut être changé en "seller" ensuite)

3. **Gestion des erreurs** :
   - Messages d'erreur clairs en français
   - Gestion des comptes déjà existants
   - Gestion des refus de connexion Google

4. **Sécurité** :
   - Utilisation de `signInWithOAuth` officiel de Supabase
   - Redirection sécurisée via `auth/callback`
   - Tokens gérés automatiquement par Supabase

---

## 🎯 Prochaines Étapes

Une fois la configuration terminée :

1. **Tester sur tous les appareils** :
   - Desktop (Chrome, Firefox, Safari, Edge)
   - Mobile iOS (Safari)
   - Mobile Android (Chrome)

2. **Communiquer aux utilisateurs** :
   - Annoncer la nouvelle fonctionnalité
   - Expliquer les avantages (connexion rapide, pas de mot de passe à retenir)

3. **Surveiller les métriques** :
   - Nombre d'inscriptions via Google vs email
   - Taux de conversion
   - Erreurs éventuelles dans les logs Supabase

---

## 📞 Support

Si vous rencontrez des difficultés :

1. **Documentation officielle** :
   - [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
   - [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)

2. **Logs à vérifier** :
   - Supabase → Logs → Auth Logs
   - Console développeur du navigateur (F12)

3. **Vérification rapide** :
   - Les URLs de redirection sont-elles correctes ?
   - Le Client ID et Client Secret sont-ils corrects ?
   - Les domaines sont-ils autorisés dans Google Cloud ?

---

## ✅ Checklist de Configuration

Avant de marquer la configuration comme terminée, vérifiez :

- [ ] Projet Google Cloud créé
- [ ] Écran de consentement OAuth configuré
- [ ] 3 scopes OAuth ajoutés (email, profile, openid)
- [ ] Identifiants OAuth 2.0 créés
- [ ] Origines JavaScript autorisées ajoutées
- [ ] URI de redirection Supabase ajoutée dans Google Cloud
- [ ] Google activé dans Supabase Authentication → Providers
- [ ] Client ID et Client Secret ajoutés dans Supabase
- [ ] Site URL configurée dans Supabase
- [ ] Redirect URLs configurées dans Supabase
- [ ] Test de connexion réussi sur Desktop
- [ ] Test de connexion réussi sur Mobile (iOS/Android)
- [ ] Profil créé automatiquement dans la base de données
- [ ] Email marqué comme vérifié

---

**🎉 Félicitations ! L'authentification Google OAuth est maintenant configurée pour Djassa !**

Si tout fonctionne correctement, vos utilisateurs peuvent maintenant s'inscrire et se connecter en un seul clic avec leur compte Gmail. 🚀
