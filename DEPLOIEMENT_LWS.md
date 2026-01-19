# 🚀 Guide de déploiement Djassa PWA sur LWS

## Prérequis
- Hébergement LWS avec accès FTP ou cPanel
- Domaine configuré : `djassa.tech` et `www.djassa.tech`
- Certificat SSL actif (HTTPS obligatoire pour PWA)

---

## 📦 Étape 1 : Générer le build de production

Dans votre projet local (après `git pull`) :

```bash
npm install
npm run build
```

Cela génère un dossier `dist/` contenant tous les fichiers à déployer.

---

## 📁 Étape 2 : Structure des fichiers à uploader

Uploadez le contenu du dossier `dist/` à la racine de votre hébergement LWS :

```
public_html/
├── index.html
├── manifest.json          ← PWA manifest
├── sw.js                  ← Service Worker
├── favicon.png
├── favicon.ico
├── robots.txt
├── sitemap.xml
├── _redirects
├── icons/                 ← Icônes PWA
│   ├── icon-48.png
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-256.png
│   ├── icon-384.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   └── icon-maskable-512.png
├── images/
│   └── preview.jpg
└── assets/                ← Fichiers JS/CSS générés
    └── ...
```

---

## ⚙️ Étape 3 : Configuration .htaccess

Créez ou modifiez le fichier `.htaccess` à la racine :

```apache
# Redirection HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Redirection www vers non-www (optionnel)
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# SPA Fallback - Toutes les routes vers index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Cache des assets statiques
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# Headers de sécurité
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    
    # Service Worker scope
    <FilesMatch "sw\.js$">
        Header set Service-Worker-Allowed "/"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
    
    # Manifest
    <FilesMatch "manifest\.json$">
        Header set Content-Type "application/manifest+json"
    </FilesMatch>
</IfModule>

# GZIP Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

---

## 🔒 Étape 4 : Vérification SSL

Assurez-vous que :
- ✅ HTTPS est actif sur `djassa.tech`
- ✅ HTTPS est actif sur `www.djassa.tech`
- ✅ Les redirections HTTP → HTTPS fonctionnent

Les PWA **requièrent** HTTPS pour fonctionner.

---

## ✅ Étape 5 : Test de l'installation PWA

### Sur Android (Chrome) :
1. Visitez `https://djassa.tech`
2. Attendez 3 secondes → une barre d'installation apparaît en bas
3. Cliquez sur "Installer" → l'invite native Chrome s'affiche
4. Confirmez → l'app s'installe sur l'écran d'accueil

### Sur iOS (Safari) :
1. Visitez `https://djassa.tech`
2. La barre affiche "Comment installer"
3. Suivez les instructions : Partager → Sur l'écran d'accueil

### Sur Desktop (Chrome/Edge) :
1. Visitez `https://djassa.tech`
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Ou utilisez le bouton "Installer" en bas de l'écran

---

## 🔍 Étape 6 : Validation Lighthouse

Testez votre PWA avec Chrome DevTools :
1. Ouvrez `https://djassa.tech`
2. F12 → Lighthouse → PWA
3. Vérifiez que tous les critères sont verts

### Critères PWA requis :
- ✅ HTTPS actif
- ✅ Manifest valide avec icônes
- ✅ Service Worker enregistré
- ✅ start_url accessible hors-ligne
- ✅ Viewport configuré pour mobile

---

## 📱 Fichiers critiques pour la PWA

| Fichier | Emplacement | Rôle |
|---------|-------------|------|
| `manifest.json` | Racine | Configuration de l'app |
| `sw.js` | Racine | Cache et mode hors-ligne |
| `icons/icon-*.png` | `/icons/` | Icônes de l'app |
| `index.html` | Racine | Point d'entrée |

---

## 🆘 Dépannage

### Le bouton "Installer" ne s'affiche pas ?
- Vérifiez que HTTPS est actif
- Vérifiez que `manifest.json` est accessible : `https://djassa.tech/manifest.json`
- Vérifiez que `sw.js` est accessible : `https://djassa.tech/sw.js`
- Effacez le cache du navigateur

### L'app ne fonctionne pas hors-ligne ?
- Vérifiez que le Service Worker est enregistré (DevTools → Application → Service Workers)
- Rechargez la page plusieurs fois pour peupler le cache

### L'icône n'apparaît pas sur Android ?
- Vérifiez que les icônes maskable existent dans `/icons/`
- Testez avec [Maskable.app](https://maskable.app/editor) pour valider vos icônes

---

## 📞 Support

- **URL de test** : https://djassaaaaa-marketplace.lovable.app
- **URL de production** : https://djassa.tech
- **Page d'installation** : https://djassa.tech/install

---

## 🎉 Résumé

Après déploiement, vos utilisateurs peuvent installer Djassa depuis :
1. **Android** : Barre d'installation automatique + invite Chrome
2. **iOS** : Instructions guidées Safari
3. **Desktop** : Bouton d'installation + icône navigateur

L'expérience est 100% fluide, non-intrusive, et compatible avec les standards PWA pour une future soumission aux stores.
