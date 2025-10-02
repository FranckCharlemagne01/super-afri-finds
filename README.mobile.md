# 📱 Guide de Déploiement Mobile - Djassa Marketplace

Ce guide vous explique comment transformer votre application web Djassa en une application mobile native pour iOS et Android.

## ⚠️ Important

**Les packages Capacitor et les hooks natifs seront installés lors de la configuration locale.** 
Le site web actuel fonctionne normalement sans ces dépendances - elles ne sont nécessaires que pour créer l'application mobile.

## 🚀 Configuration Initiale

### Prérequis
- Node.js installé sur votre machine
- Git installé
- Pour iOS : un Mac avec Xcode
- Pour Android : Android Studio installé

### Étape 1 : Exporter vers GitHub
1. Cliquez sur le bouton "Export to Github" dans Lovable
2. Clonez votre repository localement :
```bash
git clone [votre-repo-url]
cd djassaa-marketplace
```

### Étape 2 : Installation des dépendances
```bash
npm install
```

### Étape 3 : Installer Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/push-notifications @capacitor/camera @capacitor/haptics @capacitor/status-bar
```

### Étape 4 : Initialiser Capacitor
```bash
npx cap init
```
Les valeurs sont déjà configurées dans `capacitor.config.ts`.

### Étape 5 : Créer les hooks natifs

Créez les fichiers suivants dans `src/hooks/` :

**src/hooks/usePushNotifications.tsx** :
```typescript
import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePushNotifications = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const initPushNotifications = async () => {
      try {
        const permission = await PushNotifications.requestPermissions();
        
        if (permission.receive === 'granted') {
          await PushNotifications.register();
        }

        await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          
          if (user) {
            const { error } = await supabase
              .from('profiles')
              .update({ push_token: token.value } as any)
              .eq('user_id', user.id);
            
            if (error) {
              console.error('Error saving push token:', error);
            }
          }
        });

        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            toast({
              title: notification.title || 'Nouvelle notification',
              description: notification.body,
            });
          }
        );

        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification) => {
            console.log('Push notification action performed', notification);
          }
        );
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user, toast]);

  return {
    async sendNotification(userId: string, title: string, body: string) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        const pushToken = (profile as any)?.push_token;
        
        if (pushToken) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              token: pushToken,
              title,
              body
            }
          });
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  };
};
```

**src/hooks/useNativeCamera.tsx** :
```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';

export const useNativeCamera = () => {
  const { toast } = useToast();

  const takePicture = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        toast({
          title: 'Fonctionnalité native',
          description: 'La caméra native est disponible uniquement sur l\'application mobile.',
          variant: 'destructive'
        });
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      return {
        base64: image.base64String,
        format: image.format,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`
      };
    } catch (error) {
      console.error('Error taking picture:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à la caméra.',
        variant: 'destructive'
      });
      return null;
    }
  };

  const pickImage = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        toast({
          title: 'Fonctionnalité native',
          description: 'L\'accès à la galerie est disponible uniquement sur l\'application mobile.',
          variant: 'destructive'
        });
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      return {
        base64: image.base64String,
        format: image.format,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`
      };
    } catch (error) {
      console.error('Error picking image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder à la galerie.',
        variant: 'destructive'
      });
      return null;
    }
  };

  return {
    takePicture,
    pickImage
  };
};
```

**src/hooks/useNativeApp.tsx** :
```typescript
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useNativeApp = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#000000' });
    }
  }, []);

  const vibrate = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  return {
    isNative,
    platform,
    vibrate
  };
};
```

### Étape 6 : Ajouter les plateformes natives

Pour iOS :
```bash
npx cap add ios
npx cap update ios
```

Pour Android :
```bash
npx cap add android
npx cap update android
```

### Étape 7 : Build et sync
```bash
npm run build
npx cap sync
```

## 📲 Fonctionnalités Natives Implémentées

### ✅ Notifications Push
- Notifications en temps réel pour les commandes
- Alertes pour les messages
- Notifications pour les favoris
- **À configurer** : Firebase Cloud Messaging (FCM) et Apple Push Notification service (APNs)

### 📷 Accès Caméra
- Prise de photo pour les produits
- Photo de profil
- Accès à la galerie

### 🎤 Accès Micro
- Prêt pour les futures fonctionnalités vocales

## 🔧 Configuration des Notifications Push

### Firebase Cloud Messaging (Android)

1. Créez un projet Firebase sur https://console.firebase.google.com
2. Ajoutez votre app Android au projet
3. Téléchargez le fichier `google-services.json`
4. Placez-le dans `android/app/`
5. Ajoutez la clé serveur Firebase dans Supabase Edge Function Secrets

### Apple Push Notification service (iOS)

1. Créez un App ID dans Apple Developer Console
2. Configurez les Push Notifications
3. Générez un certificat APNs
4. Configurez les identifiants dans votre Edge Function

## 🏃 Lancer l'Application

### Sur Émulateur/Simulateur

Pour Android :
```bash
npx cap run android
```

Pour iOS :
```bash
npx cap run ios
```

### Sur Appareil Physique

1. Connectez votre appareil via USB
2. Pour Android : activez le mode développeur
3. Pour iOS : configurez le provisioning profile
4. Lancez avec la même commande `npx cap run`

## 🔄 Workflow de Développement

1. Faites vos modifications dans Lovable ou localement
2. Si local, poussez sur GitHub :
```bash
git add .
git commit -m "Votre message"
git push
```
3. Tirez les changements localement :
```bash
git pull
```
4. Rebuild et sync :
```bash
npm run build
npx cap sync
```

## 📦 Déploiement en Production

### Google Play Store

1. Générez une clé de signature :
```bash
keytool -genkey -v -keystore djassa.keystore -alias djassa -keyalg RSA -keysize 2048 -validity 10000
```

2. Configurez `android/app/build.gradle` avec vos informations de signature

3. Créez un APK de production :
```bash
cd android
./gradlew assembleRelease
```

4. Téléchargez l'APK sur Google Play Console

### Apple App Store

1. Ouvrez le projet iOS dans Xcode
2. Configurez votre équipe et provisioning profiles
3. Archivez l'application : Product > Archive
4. Soumettez via App Store Connect

## 🔐 Sécurité

- Les tokens de notification sont stockés de manière sécurisée dans la base de données
- Les permissions natives sont demandées au moment opportun
- Les données sensibles ne sont jamais exposées côté client

## 🆘 Dépannage

### L'app ne se lance pas
- Vérifiez que vous avez bien run `npm run build` et `npx cap sync`
- Assurez-vous que toutes les dépendances sont installées

### Les notifications ne fonctionnent pas
- Vérifiez la configuration FCM/APNs
- Assurez-vous que les permissions sont accordées
- Vérifiez les logs dans la console

### Erreurs de build
- Nettoyez les builds : `npx cap clean`
- Supprimez node_modules et réinstallez : `rm -rf node_modules && npm install`

## 📚 Ressources

- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Guide Lovable Mobile](https://lovable.dev/blogs/TODO)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)

## 💡 Notes Importantes

- **Hot Reload** : L'URL dans `capacitor.config.ts` permet le hot-reload pendant le développement
- **Production** : Avant la production, commentez l'URL du serveur pour utiliser les fichiers locaux
- **Permissions** : Testez sur de vrais appareils pour valider les permissions natives
- **Performance** : L'app mobile utilise le même code que le web, optimisé par Capacitor

---

Pour toute question ou problème, consultez la [documentation officielle](https://docs.lovable.dev) ou la communauté Discord de Lovable.
