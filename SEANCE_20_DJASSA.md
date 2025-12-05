# 📋 DJASSA - Document de Présentation Séance 20

**Application**: Djassa - Marketplace Mobile pour la Côte d'Ivoire  
**Date**: Décembre 2024  
**Version**: 1.0

---

## 🎯 TAGLINE (Phrase d'identité)

> **"Djassa — Votre marché, dans votre poche. Achetez, vendez, prospérez."**

Alternatives :
- "Djassa — Le marché ivoirien, réinventé pour le mobile."
- "Djassa — Créez votre boutique en ligne en 2 minutes, vendez partout en Côte d'Ivoire."

---

## 📊 MINI BUSINESS MODEL CANVAS (BMC)

### 1. 💎 PROPOSITION DE VALEUR

**Pour les vendeurs :**
- Création de boutique en ligne **gratuite pendant 28 jours**
- Zéro commission sur les ventes (modèle par abonnement)
- Interface 100% mobile-first, optimisée pour smartphones
- Système de boost pour augmenter la visibilité des produits
- Paiements sécurisés via Paystack (Orange Money, MTN, Wave, carte)

**Pour les acheteurs :**
- Accès à des milliers de produits locaux
- Navigation fluide et intuitive style "app native"
- Contact direct avec les vendeurs via messagerie intégrée
- Recherche intelligente avec filtres par catégorie et localisation
- Produits locaux vérifiés et vendeurs identifiés

---

### 2. 👥 SEGMENTS CLIENTS

| Segment | Description | Taille estimée |
|---------|-------------|----------------|
| **Vendeurs primaires** | Petits commerçants (boutiques, marchés) | 500K+ en CI |
| **Vendeurs secondaires** | Artisans, créateurs locaux | 200K+ |
| **Vendeurs tertiaires** | Particuliers (vente occasionnelle) | 2M+ potentiels |
| **Acheteurs urbains** | 18-45 ans, smartphone, Abidjan et grandes villes | 3M+ |
| **Acheteurs périurbains** | Zones secondaires, accès mobile | 2M+ |

**Persona principal vendeur :** Aminata, 32 ans, vendeuse de pagnes à Adjamé, smartphone Android, veut toucher plus de clients sans se déplacer.

**Persona principal acheteur :** Konan, 28 ans, employé à Abidjan, cherche des produits locaux de qualité sans perdre du temps au marché.

---

### 3. 🔴 PROBLÈMES DES CLIENTS

**Problèmes des vendeurs :**
| Problème | Impact | Solution Djassa |
|----------|--------|-----------------|
| Visibilité limitée au quartier | Perte de 80% du marché potentiel | Marketplace nationale |
| Pas de présence en ligne professionnelle | Crédibilité faible | Boutique personnalisée |
| Commissions élevées (Jumia 15-25%) | Marges réduites | 0% commission |
| Complexité des plateformes existantes | Abandon | Interface ultra-simple |
| Paiements cash uniquement | Risques, gestion complexe | Paiements mobile money |

**Problèmes des acheteurs :**
| Problème | Impact | Solution Djassa |
|----------|--------|-----------------|
| Offres dispersées sur Facebook/WhatsApp | Perte de temps | Catalogue centralisé |
| Manque de confiance (arnaques) | Hésitation à acheter | Vendeurs vérifiés, avis |
| Parcours d'achat long et complexe | Abandon | Commande en 3 clics |
| Difficulté à trouver des produits locaux | Frustration | Recherche intelligente |

---

### 4. ✅ SOLUTION - FONCTIONNEMENT DE DJASSA

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE DJASSA                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  👤 VENDEUR                        👤 ACHETEUR               │
│     │                                   │                    │
│     ▼                                   ▼                    │
│  ┌──────────────┐                ┌──────────────┐           │
│  │ Inscription  │                │  Navigation  │           │
│  │  (2 min)     │                │   Produits   │           │
│  └──────┬───────┘                └──────┬───────┘           │
│         │                               │                    │
│         ▼                               ▼                    │
│  ┌──────────────┐                ┌──────────────┐           │
│  │ Boutique     │◄──────────────►│  Recherche   │           │
│  │ Automatique  │                │  & Filtres   │           │
│  └──────┬───────┘                └──────┬───────┘           │
│         │                               │                    │
│         ▼                               ▼                    │
│  ┌──────────────┐                ┌──────────────┐           │
│  │ Publication  │                │  Commande    │           │
│  │  Produits    │                │   Rapide     │           │
│  └──────┬───────┘                └──────┬───────┘           │
│         │                               │                    │
│         └───────────┬───────────────────┘                   │
│                     ▼                                        │
│              ┌──────────────┐                                │
│              │  Messagerie  │                                │
│              │   Intégrée   │                                │
│              └──────┬───────┘                                │
│                     │                                        │
│                     ▼                                        │
│              ┌──────────────┐                                │
│              │   Paiement   │                                │
│              │   Paystack   │                                │
│              └──────────────┘                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Fonctionnalités clés :**

1. **Inscription simplifiée** (2 minutes)
   - Email + mot de passe
   - Choix du rôle (acheteur/vendeur)
   - Création automatique de la boutique

2. **Gestion des produits**
   - Upload photos multiples
   - Catégorisation automatique
   - Prix et stock
   - Boost payant pour visibilité

3. **Système de tokens**
   - 100 tokens gratuits à l'inscription
   - 1 token = 1 publication
   - Achat de tokens supplémentaires

4. **Dashboard vendeur**
   - Statistiques de vente
   - Gestion des commandes
   - Messagerie clients
   - Solde de tokens

---

### 5. 📢 CANAUX / ACQUISITION

| Canal | Stratégie | Coût estimé | Impact attendu |
|-------|-----------|-------------|----------------|
| **Facebook/Instagram Ads** | Ciblage Abidjan 18-45 ans | 200K-500K FCFA/mois | 60% des acquisitions |
| **WhatsApp Marketing** | Groupes de vendeurs locaux | Gratuit | 15% des acquisitions |
| **Bouche à oreille** | Programme de parrainage | Variable | 20% des acquisitions |
| **Influenceurs locaux** | Partenariats micro-influenceurs | 100K-300K FCFA/mois | 5% des acquisitions |
| **SEO/ASO** | Optimisation recherche | Temps | Long terme |

**Stratégie d'acquisition vendeurs :**
1. Démarchage direct dans les marchés (Adjamé, Treichville, Cocody)
2. Partenariats avec associations de commerçants
3. Offre d'essai gratuit 28 jours comme levier

---

### 6. 💰 REVENUS

| Source de revenus | Modèle | Prix | Projection M1-M6 |
|-------------------|--------|------|------------------|
| **Abonnement vendeur** | Mensuel après essai | 5 000 FCFA/mois | 500K-2M FCFA/mois |
| **Achat de tokens** | À la demande | 2 000 FCFA / 12 tokens | 100K-500K FCFA/mois |
| **Boost produits** | Pay-per-boost | 2 tokens / boost | Inclus dans tokens |
| **Publicités vendeurs** | Premium placement | À définir | Phase 2 |

**Projection financière :**
```
Mois 1-3 (Lancement):
- 50-100 vendeurs actifs
- Revenus: 250K - 500K FCFA/mois

Mois 4-6 (Croissance):
- 200-500 vendeurs actifs
- Revenus: 1M - 2.5M FCFA/mois

Mois 7-12 (Scale):
- 1000-2000 vendeurs actifs
- Revenus: 5M - 10M FCFA/mois
```

---

### 7. 💸 COÛTS

| Catégorie | Description | Coût mensuel |
|-----------|-------------|--------------|
| **Infrastructure** | Supabase Pro + Vercel | 50-100K FCFA |
| **Paiements** | Frais Paystack (1.5%) | Variable |
| **Marketing** | Ads + Influence | 200-500K FCFA |
| **Développement** | Maintenance + features | 0-200K FCFA* |
| **Support** | Service client | 50-100K FCFA |
| **Légal** | Enregistrement, conformité | 20K FCFA |

*Si développement interne

**Coût total estimé:** 320K - 920K FCFA/mois

**Point mort estimé:** 100-150 vendeurs payants

---

### 8. 📈 INDICATEURS CLÉS (KPIs)

| KPI | Définition | Objectif M3 | Objectif M12 |
|-----|------------|-------------|--------------|
| **MAU** | Utilisateurs actifs mensuels | 500 | 5 000 |
| **Vendeurs actifs** | Avec ≥1 produit publié | 100 | 1 000 |
| **Taux de conversion trial** | Essai → Payant | 20% | 35% |
| **ARPU** | Revenu moyen par vendeur | 5K FCFA | 7K FCFA |
| **Churn rate** | Taux de désabonnement | <15% | <10% |
| **GMV** | Volume brut des ventes | 5M FCFA | 100M FCFA |
| **NPS** | Score de recommandation | 30 | 50 |
| **CAC** | Coût acquisition client | 2K FCFA | 1.5K FCFA |
| **LTV** | Valeur vie client | 30K FCFA | 60K FCFA |

---

### 9. 🏆 AVANTAGE COMPÉTITIF

| Avantage | Djassa | Jumia | Facebook/WhatsApp |
|----------|--------|-------|-------------------|
| **Commission sur ventes** | 0% | 15-25% | 0% |
| **Essai gratuit** | 28 jours | Non | N/A |
| **Mobile-first natif** | ✅ | Partiel | Non optimisé |
| **Paiements locaux intégrés** | ✅ | ✅ | Non |
| **Boutique personnalisée** | ✅ | Non | Non |
| **Messagerie intégrée** | ✅ | Limité | ✅ |
| **Simplicité d'utilisation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Focus Côte d'Ivoire** | ✅ | Multi-pays | Global |

**Moat (Fossé défensif) :**
1. **Expérience ultra-locale** : Conçu pour les réalités ivoiriennes
2. **Effet réseau** : Plus de vendeurs → Plus d'acheteurs → Plus de vendeurs
3. **Données locales** : Connaissance fine du marché ivoirien
4. **Coût de switching** : Vendeurs investis dans leur boutique

---

## 💳 PIPELINE DE PAIEMENT DÉTAILLÉ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PIPELINE DE PAIEMENT DJASSA                          │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────┐
    │ ÉTAPE 1: INSCRIPTION                                                  │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                       │
    │  Utilisateur ──► Page /auth ──► Choix: Acheteur | Vendeur            │
    │                                                                       │
    │  Si VENDEUR:                                                          │
    │    • Email + Mot de passe                                            │
    │    • Nom de la boutique (optionnel)                                  │
    │    • Validation email                                                 │
    │                                                                       │
    │  ┌─────────────────────────────────────────────────────────────────┐ │
    │  │ ACTIONS AUTOMATIQUES:                                            │ │
    │  │ • Création profil (profiles table)                              │ │
    │  │ • Attribution rôle 'seller' (user_roles table)                  │ │
    │  │ • Création boutique automatique (seller_shops table)            │ │
    │  │ • Attribution 100 tokens gratuits (seller_tokens table)         │ │
    │  │ • Démarrage période d'essai 28 jours (trial_start/end)         │ │
    │  └─────────────────────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ ÉTAPE 2: PÉRIODE D'ESSAI GRATUIT (28 JOURS)                          │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                       │
    │  FONCTIONNALITÉS DISPONIBLES:                                         │
    │  ✅ Publication illimitée de produits (sans consommation de tokens)  │
    │  ✅ Boost de produits gratuit                                         │
    │  ✅ Messagerie avec clients                                           │
    │  ✅ Gestion des commandes                                             │
    │  ✅ Dashboard complet avec statistiques                               │
    │  ✅ 100 tokens offerts pour après l'essai                            │
    │                                                                       │
    │  AFFICHAGE INTERFACE:                                                 │
    │  ┌─────────────────────────────────────────────────────────────────┐ │
    │  │ 🎁 Période d'essai: 15 jours restants                           │ │
    │  │ Profitez de toutes les fonctionnalités gratuitement!            │ │
    │  └─────────────────────────────────────────────────────────────────┘ │
    │                                                                       │
    │  VÉRIFICATION (fonction SQL can_access_seller_features):             │
    │    IF trial_used = false AND trial_end_date > now() → ACCÈS OK      │
    │                                                                       │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                         Jour 28 atteint
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ ÉTAPE 3: FIN D'ESSAI - INVITATION AU PAIEMENT                        │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                       │
    │  DÉCLENCHEUR:                                                         │
    │    trial_end_date < now() ET subscription.status ≠ 'active'          │
    │                                                                       │
    │  AFFICHAGE:                                                           │
    │  ┌─────────────────────────────────────────────────────────────────┐ │
    │  │ ⚠️ Votre période d'essai est terminée                           │ │
    │  │                                                                   │ │
    │  │ Pour continuer à vendre sur Djassa, activez votre abonnement:   │ │
    │  │                                                                   │ │
    │  │ ┌─────────────────────────────────────────────────────────────┐ │ │
    │  │ │  ABONNEMENT VENDEUR                                         │ │ │
    │  │ │  5 000 FCFA / mois                                          │ │ │
    │  │ │                                                              │ │ │
    │  │ │  ✓ Publications illimitées                                  │ │ │
    │  │ │  ✓ Boost gratuits                                           │ │ │
    │  │ │  ✓ Support prioritaire                                      │ │ │
    │  │ │                                                              │ │ │
    │  │ │  [Activer mon abonnement - Paystack]                        │ │ │
    │  │ └─────────────────────────────────────────────────────────────┘ │ │
    │  └─────────────────────────────────────────────────────────────────┘ │
    │                                                                       │
    │  BLOCAGE:                                                             │
    │  • Impossible de publier nouveaux produits                           │
    │  • Impossible de booster produits                                    │
    │  • Produits existants restent visibles (mais non modifiables)       │
    │  • Messagerie toujours accessible                                    │
    │                                                                       │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                         Clic sur "Activer"
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ ÉTAPE 4: PASSAGE AU PAIEMENT VIA PAYSTACK (MODE LIVE)                │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                       │
    │  1. INITIALISATION (Edge Function: subscription-payment)             │
    │     ┌─────────────────────────────────────────────────────────────┐  │
    │     │ POST /functions/v1/subscription-payment                     │  │
    │     │                                                              │  │
    │     │ Headers:                                                     │  │
    │     │   Authorization: Bearer <JWT_TOKEN>                         │  │
    │     │                                                              │  │
    │     │ Body:                                                        │  │
    │     │   {                                                          │  │
    │     │     "user_id": "uuid",                                      │  │
    │     │     "email": "vendeur@email.com",                           │  │
    │     │     "amount": 5000,                                         │  │
    │     │     "plan": "monthly"                                       │  │
    │     │   }                                                          │  │
    │     └─────────────────────────────────────────────────────────────┘  │
    │                                                                       │
    │  2. VÉRIFICATION AUTHENTIFICATION                                     │
    │     • JWT validé par Supabase (verify_jwt = true)                    │
    │     • Vérification: user_id demandé = user authentifié               │
    │     • Si non-correspondance → 403 Forbidden                          │
    │                                                                       │
    │  3. CRÉATION TRANSACTION PAYSTACK                                     │
    │     • Appel API Paystack: POST /transaction/initialize               │
    │     • Clés: PAYSTACK_SECRET_KEY_LIVE (mode production)              │
    │     • Devise: XOF                                                    │
    │     • Callback URL configuré                                         │
    │                                                                       │
    │  4. REDIRECTION PAYSTACK                                              │
    │     ┌─────────────────────────────────────────────────────────────┐  │
    │     │ Réponse:                                                     │  │
    │     │ {                                                            │  │
    │     │   "authorization_url": "https://checkout.paystack.com/xxx", │  │
    │     │   "reference": "sub_uuid_timestamp"                         │  │
    │     │ }                                                            │  │
    │     └─────────────────────────────────────────────────────────────┘  │
    │                                                                       │
    │  5. PAGE DE PAIEMENT PAYSTACK                                         │
    │     ┌─────────────────────────────────────────────────────────────┐  │
    │     │                    [PAYSTACK CHECKOUT]                      │  │
    │     │                                                              │  │
    │     │  Montant: 5 000 FCFA                                        │  │
    │     │                                                              │  │
    │     │  Méthodes de paiement:                                      │  │
    │     │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │  │
    │     │  │ Orange  │ │  MTN    │ │  Wave   │ │  Carte  │           │  │
    │     │  │ Money   │ │ Mobile  │ │         │ │ Bancaire│           │  │
    │     │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │  │
    │     │                                                              │  │
    │     │  [Payer 5 000 FCFA]                                         │  │
    │     └─────────────────────────────────────────────────────────────┘  │
    │                                                                       │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                         Paiement effectué
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ ÉTAPE 5: VÉRIFICATION DU PAIEMENT                                    │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                       │
    │  WEBHOOK PAYSTACK → Edge Function (paystack-payment)                 │
    │                                                                       │
    │  1. RÉCEPTION WEBHOOK                                                 │
    │     Event: charge.success                                            │
    │     Reference: sub_uuid_timestamp                                    │
    │                                                                       │
    │  2. VÉRIFICATION SIGNATURE                                            │
    │     • HMAC-SHA512 avec PAYSTACK_SECRET_KEY                           │
    │     • Comparaison avec header x-paystack-signature                   │
    │                                                                       │
    │  3. VÉRIFICATION TRANSACTION                                          │
    │     • GET /transaction/verify/{reference}                            │
    │     • Vérification status = "success"                                │
    │     • Vérification montant = 5000 XOF                                │
    │                                                                       │
    │  4. SI PAIEMENT VALIDE:                                               │
    │     ┌─────────────────────────────────────────────────────────────┐  │
    │     │ APPEL FONCTION SQL: activate_subscription()                 │  │
    │     │                                                              │  │
    │     │ Paramètres:                                                  │  │
    │     │   _user_id: UUID du vendeur                                 │  │
    │     │   _paystack_reference: "sub_xxx"                            │  │
    │     │   _amount: 5000                                             │  │
    │     │                                                              │  │
    │     │ Actions:                                                     │  │
    │     │   • INSERT/UPDATE subscriptions table                       │  │
    │     │   • status = 'active'                                       │  │
    │     │   • subscription_start = now()                              │  │
    │     │   • subscription_end = now() + 30 days                      │  │
    │     │   • UPDATE profiles: trial_used = true                      │  │
    │     └─────────────────────────────────────────────────────────────┘  │
    │                                                                       │
    │  5. SI PAIEMENT ÉCHOUÉ:                                               │
    │     • Log de l'erreur                                                │
    │     • Notification utilisateur                                       │
    │     • Pas de modification de statut                                  │
    │                                                                       │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │ ÉTAPE 6: ACTIVATION OU BLOCAGE DU COMPTE                             │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                       │
    │  ✅ SI ABONNEMENT ACTIF (subscription.status = 'active'):            │
    │                                                                       │
    │     FONCTIONNALITÉS DÉBLOQUÉES:                                       │
    │     • Publication illimitée sans tokens                              │
    │     • Boost de produits sans tokens                                  │
    │     • Accès complet au dashboard                                     │
    │     • Support prioritaire                                            │
    │                                                                       │
    │     AFFICHAGE:                                                        │
    │     ┌─────────────────────────────────────────────────────────────┐  │
    │     │ ✅ Abonnement actif                                         │  │
    │     │ Expire le: 15 janvier 2025                                  │  │
    │     │ [Gérer mon abonnement]                                      │  │
    │     └─────────────────────────────────────────────────────────────┘  │
    │                                                                       │
    │  ───────────────────────────────────────────────────────────────────  │
    │                                                                       │
    │  ❌ SI ABONNEMENT EXPIRÉ/INACTIF:                                    │
    │                                                                       │
    │     FONCTIONNALITÉS BLOQUÉES:                                         │
    │     • Nouvelle publication → Message "Abonnez-vous"                  │
    │     • Boost → Message "Abonnez-vous"                                 │
    │     • Modification produits → Bloqué                                 │
    │                                                                       │
    │     FONCTIONNALITÉS MAINTENUES:                                       │
    │     • Consultation des commandes existantes                          │
    │     • Messagerie (réponse aux clients)                               │
    │     • Visualisation des statistiques                                 │
    │                                                                       │
    │     AFFICHAGE:                                                        │
    │     ┌─────────────────────────────────────────────────────────────┐  │
    │     │ ⚠️ Abonnement requis                                        │  │
    │     │                                                              │  │
    │     │ Pour publier et booster vos produits, activez votre         │  │
    │     │ abonnement vendeur.                                         │  │
    │     │                                                              │  │
    │     │ [Activer pour 5 000 FCFA/mois]                              │  │
    │     └─────────────────────────────────────────────────────────────┘  │
    │                                                                       │
    └──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────────────────────┐
    │ RENOUVELLEMENT AUTOMATIQUE                                           │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                       │
    │  J-7 avant expiration:                                               │
    │    → Email de rappel                                                 │
    │    → Notification in-app                                             │
    │                                                                       │
    │  J-1 avant expiration:                                               │
    │    → Email urgent                                                    │
    │    → Banner prominent dans l'app                                     │
    │                                                                       │
    │  Jour d'expiration:                                                  │
    │    → Passage en mode "abonnement expiré"                             │
    │    → Blocage des fonctionnalités premium                             │
    │    → Invitation au renouvellement                                    │
    │                                                                       │
    └──────────────────────────────────────────────────────────────────────┘
```

---

## 🗓️ ROADMAP 90 JOURS

### Phase 1: Stabilisation (Jours 1-30)

| Semaine | Actions | Livrables | KPIs |
|---------|---------|-----------|------|
| **S1** | Correction bugs critiques | App stable | 0 bugs bloquants |
| | Tests de paiement Paystack live | Paiements fonctionnels | 100% transactions OK |
| | Sécurisation edge functions | Auth renforcée | Audit passé |
| **S2** | Optimisation performance mobile | Temps chargement <2s | Lighthouse >80 |
| | Tests utilisateurs (5-10 vendeurs) | Feedback documenté | NPS baseline |
| | Documentation utilisateur | Guide vendeur PDF | 1 guide complet |
| **S3** | Amélioration UX inscription | Tunnel optimisé | Conversion +20% |
| | Setup analytics (Mixpanel/Amplitude) | Dashboard analytics | Events trackés |
| | Premier batch marketing | 50 vendeurs inscrits | 50 comptes créés |
| **S4** | Onboarding vendeurs pilotes | 20 vendeurs actifs | 20 boutiques live |
| | Support client setup | Process support | <24h réponse |
| | Bilan phase 1 | Rapport | Go/No-go phase 2 |

### Phase 2: Acquisition (Jours 31-60)

| Semaine | Actions | Livrables | KPIs |
|---------|---------|-----------|------|
| **S5** | Campagne Facebook Ads | Ads live | 1000 impressions/jour |
| | Partenariat 3 influenceurs | Posts sponsorisés | 5000 reach |
| | Programme parrainage | Système référral | 10% via parrainage |
| **S6** | Démarchage marchés (Adjamé) | 30 contacts | 15 inscriptions |
| | Optimisation conversion trial→paid | A/B tests | Conversion +10% |
| | Feature: notifications push | Push fonctionnel | 60% opt-in |
| **S7** | Expansion géographique (Bouaké) | Présence Bouaké | 10 vendeurs Bouaké |
| | Content marketing (blog/vidéos) | 4 contenus | 500 vues |
| | Amélioration SEO/ASO | Optimisation stores | Ranking amélioré |
| **S8** | Event physique (mini-salon) | 1 événement | 50 participants |
| | Témoignages vendeurs | 5 vidéos témoignages | Social proof |
| | Bilan phase 2 | Rapport croissance | 100 vendeurs actifs |

### Phase 3: Monétisation (Jours 61-90)

| Semaine | Actions | Livrables | KPIs |
|---------|---------|-----------|------|
| **S9** | Analyse conversions trial | Rapport détaillé | Insights actionnables |
| | Email nurturing séquence | 5 emails automatisés | Open rate >30% |
| | Offre promotionnelle lancement | -20% 3 premiers mois | Conversion boost |
| **S10** | Feature: stats avancées vendeurs | Dashboard pro | Valeur perçue + |
| | Programme fidélité early adopters | Avantages exclusifs | Rétention +15% |
| | Optimisation pricing | Tests prix | Prix optimal validé |
| **S11** | Automatisation support (chatbot) | Bot FAQ | -30% tickets |
| | Intégration livreurs partenaires | 2 partenaires | Option livraison |
| | Marketing retargeting | Campaigns actives | Récupération 10% |
| **S12** | Bilan 90 jours complet | Rapport final | Décision pivot/scale |
| | Préparation levée seed (si go) | Pitch deck | Deck prêt |
| | Planification Q2 | Roadmap Q2 | Plan validé |

**Objectifs 90 jours:**
- 200 vendeurs inscrits
- 50 vendeurs payants
- 500K FCFA MRR
- NPS > 30
- <5% churn

---

## 📅 ROADMAP 12 MOIS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ROADMAP 12 MOIS DJASSA                             │
└─────────────────────────────────────────────────────────────────────────────┘

Q1 (M1-M3): FONDATION & VALIDATION
═══════════════════════════════════════════════════════════════════════════════

M1: Stabilisation          M2: Acquisition          M3: Monétisation
─────────────────          ─────────────────        ─────────────────
• Bugs critiques           • Facebook Ads           • Conversion trial
• Sécurité                 • Influenceurs           • Email nurturing
• Performance              • Marchés physiques      • Pricing optimal
• 20 vendeurs pilotes      • 100 vendeurs           • 50 vendeurs payants

Objectifs Q1: 200 vendeurs | 50 payants | 500K FCFA MRR


Q2 (M4-M6): CROISSANCE & FEATURES
═══════════════════════════════════════════════════════════════════════════════

M4: Scale Marketing        M5: Product Market Fit   M6: Expansion
─────────────────          ─────────────────        ─────────────────
• Budget ads x2            • Analytics avancés      • Bouaké, Yamoussoukro
• Partenariats associa-    • Avis & notes          • San Pedro, Daloa
  tions commerçants        • Catégories enrichies   • 5 villes couvertes
• Content strategy         • Search amélioré        • Équipe support +1

Nouvelles features:
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Système d'avis acheteurs                                                  │
│ • Catégories personnalisées                                                 │
│ • Recherche par localisation                                                │
│ • Dashboard analytics vendeur avancé                                        │
│ • Notifications push enrichies                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Objectifs Q2: 500 vendeurs | 150 payants | 1.5M FCFA MRR


Q3 (M7-M9): SCALE & PARTENARIATS
═══════════════════════════════════════════════════════════════════════════════

M7: Logistics              M8: Payments             M9: B2B
─────────────────          ─────────────────        ─────────────────
• Intégration livreurs     • Wave intégration       • Offre entreprises
• Suivi colis temps réel   • Paiement échelonné     • API partenaires
• Zones de livraison       • Protection acheteur    • White-label test

Nouvelles features:
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Intégration 3+ services de livraison                                      │
│ • Suivi de commande temps réel                                              │
│ • Protection acheteur (escrow)                                              │
│ • Wave Pay intégration                                                      │
│ • Paiement en plusieurs fois                                                │
│ • API publique pour partenaires                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Objectifs Q3: 1000 vendeurs | 400 payants | 3M FCFA MRR


Q4 (M10-M12): EXPANSION & LEVÉE
═══════════════════════════════════════════════════════════════════════════════

M10: Regional              M11: Fundraising         M12: Scale
─────────────────          ─────────────────        ─────────────────
• Test Sénégal/Mali        • Pitch investisseurs    • Équipe +3
• Adaptation locale        • Due diligence          • Infrastructure scale
• Partenaires régionaux    • Term sheet             • Objectifs 2026

Nouvelles features:
┌─────────────────────────────────────────────────────────────────────────────┐
│ • Multi-devises (XOF, GNF, CDF)                                            │
│ • Multi-langues (FR, EN)                                                    │
│ • App native iOS/Android                                                    │
│ • Programme ambassadeurs                                                    │
│ • Intelligence artificielle (recommandations)                               │
└─────────────────────────────────────────────────────────────────────────────┘

Objectifs Q4: 2000 vendeurs | 800 payants | 6M FCFA MRR


RÉSUMÉ FINANCIER ANNÉE 1
═══════════════════════════════════════════════════════════════════════════════

           │  Vendeurs  │  Payants  │    MRR     │    ARR     │
───────────┼────────────┼───────────┼────────────┼────────────┤
    Q1     │    200     │    50     │   500K     │    6M      │
    Q2     │    500     │   150     │   1.5M     │   18M      │
    Q3     │   1000     │   400     │    3M      │   36M      │
    Q4     │   2000     │   800     │    6M      │   72M      │
───────────┴────────────┴───────────┴────────────┴────────────┘

Investissement nécessaire: 15-25M FCFA (seed)
Break-even estimé: M8-M10
```

---

## 📸 SECTION CAPTURE / DÉMO

### Comment présenter Djassa visuellement

#### Option 1: Captures d'écran annotées

Préparez une série de 5-7 captures d'écran clés avec annotations:

```
┌─────────────────────────────────────────────────────────────┐
│ CAPTURE 1: PAGE D'ACCUEIL                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Screenshot de la page /marketplace]                       │
│                                                              │
│  Annotations:                                                │
│  → "Recherche intelligente"                                 │
│  → "Catégories populaires"                                  │
│  → "Produits mis en avant"                                  │
│  → "Design mobile-first"                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CAPTURE 2: INSCRIPTION VENDEUR                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Screenshot de /auth?mode=signup&role=seller]              │
│                                                              │
│  Annotations:                                                │
│  → "Inscription en 2 minutes"                               │
│  → "28 jours d'essai gratuit"                               │
│  → "100 tokens offerts"                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CAPTURE 3: DASHBOARD VENDEUR                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Screenshot de /seller]                                    │
│                                                              │
│  Annotations:                                                │
│  → "Vue d'ensemble des ventes"                              │
│  → "Gestion des commandes"                                  │
│  → "Statistiques en temps réel"                             │
│  → "Solde de tokens"                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CAPTURE 4: PUBLICATION PRODUIT                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Screenshot du formulaire produit]                         │
│                                                              │
│  Annotations:                                                │
│  → "Photos multiples"                                       │
│  → "Catégorisation simple"                                  │
│  → "Prix et stock"                                          │
│  → "Publication en 1 clic"                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CAPTURE 5: BOUTIQUE VENDEUR                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Screenshot de /boutique/xxx]                              │
│                                                              │
│  Annotations:                                                │
│  → "Boutique personnalisée"                                 │
│  → "Catalogue produits"                                     │
│  → "Contact direct"                                         │
│  → "URL unique partageable"                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Option 2: Vidéo démo (60-90 secondes)

**Script recommandé:**

```
[0:00-0:10] INTRO
"Djassa, c'est votre marché dans votre poche."
→ Montrer logo + tagline animé

[0:10-0:25] PROBLÈME
"Vous êtes commerçant en Côte d'Ivoire? 
Vous voulez vendre en ligne mais les plateformes sont compliquées et chères?"
→ Images de marchés traditionnels

[0:25-0:45] SOLUTION
"Avec Djassa, créez votre boutique en 2 minutes.
Inscription gratuite, 28 jours d'essai, zéro commission."
→ Démonstration inscription rapide

[0:45-1:05] FONCTIONNALITÉS
"Publiez vos produits, recevez des commandes, 
gérez tout depuis votre téléphone."
→ Parcours publication produit + réception commande

[1:05-1:20] PAIEMENT
"Paiements sécurisés via Orange Money, MTN, Wave."
→ Écran Paystack

[1:20-1:30] CALL TO ACTION
"Rejoignez les vendeurs Djassa. Téléchargez maintenant!"
→ Logo + QR code / lien
```

**Outils recommandés pour créer la vidéo:**
- **Loom** (gratuit): Enregistrement écran + voix
- **Canva** (gratuit): Montage simple avec animations
- **CapCut** (gratuit): Édition mobile avancée

#### Option 3: GIF animés

Créez 3-4 GIFs montrant les actions clés:
1. Inscription vendeur (5 secondes)
2. Publication produit (8 secondes)
3. Réception commande (5 secondes)
4. Checkout acheteur (8 secondes)

**Outil:** Giphy Capture, LICEcap, ou CloudApp

#### Conseils de présentation

1. **Utilisez un vrai téléphone** en démo live si possible
2. **Pré-remplissez des données** de test réalistes
3. **Préparez un compte vendeur** avec produits déjà publiés
4. **Testez la connexion** avant la présentation
5. **Ayez un backup** (vidéo pré-enregistrée) en cas de problème technique

---

## 🎯 ANALYSE STRATÉGIQUE: POSITIONNEMENT

### Les 4 options de positionnement

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MATRICE DE POSITIONNEMENT STARTUP                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            IMPACT POTENTIEL                                  │
│                                  ▲                                           │
│                                  │                                           │
│                     FUTUR GÉANT  │  FUTUR GÉANT                             │
│                     (risqué)     │  (idéal)                                 │
│                                  │                                           │
│          ────────────────────────┼────────────────────────────────►         │
│                                  │                              RESSOURCES   │
│                     LABO         │  BUSINESS                                │
│                                  │                                           │
│                     SIDE PROJECT │  SIDE PROJECT                            │
│                     (viable)     │  (sous-exploité)                         │
│                                  │                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Évaluation de Djassa

| Critère | Score (1-5) | Commentaire |
|---------|-------------|-------------|
| **Taille du marché** | ⭐⭐⭐⭐⭐ | 27M habitants CI, e-commerce en explosion |
| **Problème validé** | ⭐⭐⭐⭐ | Commerçants veulent digitaliser |
| **Solution différenciée** | ⭐⭐⭐⭐ | 0% commission, ultra-simple |
| **Traction actuelle** | ⭐⭐ | Produit construit, peu d'utilisateurs |
| **Équipe** | ⭐⭐⭐ | Tech solide, besoin commercial |
| **Scalabilité** | ⭐⭐⭐⭐⭐ | Très scalable, coûts marginaux faibles |
| **Monétisation** | ⭐⭐⭐⭐ | Modèle clair, testé ailleurs |
| **Barrières à l'entrée** | ⭐⭐⭐ | Effet réseau potentiel |

**Score global: 31/40 = 77.5%**

### Analyse par option

#### 🧪 Option 1: LABO
*"Expérimenter des idées, apprendre"*

| Pour | Contre |
|------|--------|
| Peu de pression | Pas de revenus |
| Liberté créative | Pas de validation marché |
| Apprentissage tech | Risque d'abandon |

**Verdict: ❌ Non recommandé** - Djassa est trop avancé pour être un simple labo.

---

#### 🌙 Option 2: SIDE PROJECT
*"Projet passion à côté d'une activité principale"*

| Pour | Contre |
|------|--------|
| Revenus complémentaires | Croissance lente |
| Pas de risque emploi | Concurrence peut dépasser |
| Flexibilité temporelle | Difficile de scaler |

**Verdict: ⚠️ Possible** - Si vous avez un emploi stable et voulez tester le marché à votre rythme. Risque: un concurrent plus investi prend le marché.

**Si Side Project:**
- 10-15h/semaine max
- Objectif: 100 vendeurs payants en 12 mois
- Pas d'investissement externe
- Automatiser maximum

---

#### 💼 Option 3: BUSINESS
*"Entreprise à temps plein, objectif rentabilité"*

| Pour | Contre |
|------|--------|
| Focus total | Risque financier personnel |
| Croissance rapide possible | Pression revenus |
| Crédibilité partenaires | Besoin capital initial |

**Verdict: ✅ Recommandé** - Le marché est là, le produit est prêt, c'est le moment d'exécuter.

**Si Business:**
- Temps plein dédié
- Objectif: 500 vendeurs payants en 12 mois
- Lever 15-25M FCFA seed
- Équipe de 3-5 personnes
- Break-even en 8-12 mois

---

#### 🚀 Option 4: FUTUR GÉANT
*"Ambition de devenir leader régional/continental"*

| Pour | Contre |
|------|--------|
| Vision inspirante | Besoin gros capitaux |
| Attire talents/investisseurs | Exécution complexe |
| Potentiel exit important | Concurrence Jumia, Glovo |

**Verdict: 🎯 Objectif long terme** - Pas réaliste immédiatement, mais c'est la vision à 5 ans si le business fonctionne.

**Si Futur Géant (vision):**
- Lever 500M+ FCFA (Série A)
- Expansion CEDEAO
- Équipe 50+ personnes
- Objectif: #1 marketplace Afrique francophone

---

### 🏆 RECOMMANDATION FINALE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   RECOMMANDATION: BUSINESS avec vision FUTUR GÉANT                          │
│                                                                              │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   Court terme (0-12 mois):                                                   │
│   • Approche BUSINESS: focus exécution, rentabilité                         │
│   • Objectif: prouver le modèle en Côte d'Ivoire                           │
│   • KPI clé: 500 vendeurs payants, break-even                              │
│                                                                              │
│   Moyen terme (12-36 mois):                                                  │
│   • Si validation → Lever fonds pour accélérer                              │
│   • Expansion régionale (Sénégal, Mali, Burkina)                           │
│   • Construire l'effet réseau                                               │
│                                                                              │
│   Long terme (3-5 ans):                                                      │
│   • Ambition FUTUR GÉANT                                                    │
│   • Leader e-commerce Afrique francophone                                   │
│   • Potentiel acquisition ou IPO                                            │
│                                                                              │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                              │
│   POURQUOI CETTE RECOMMANDATION:                                             │
│                                                                              │
│   1. Le marché est ÉNORME et sous-exploité                                  │
│   2. Jumia a échoué à adresser les petits commerçants                       │
│   3. Le timing est parfait (pénétration mobile, mobile money)               │
│   4. Le produit est PRÊT - c'est rare et précieux                          │
│   5. Le modèle (0% commission) est disruptif et défendable                 │
│                                                                              │
│   RISQUES À MITIGER:                                                         │
│                                                                              │
│   • Besoin d'un co-fondateur commercial/growth                              │
│   • Capital initial pour tenir 12-18 mois                                   │
│   • Exécution terrain (pas que tech)                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST SÉANCE 20

- [ ] Mini BMC complet (9 cases)
- [ ] Pipeline de paiement détaillé
- [ ] Roadmap 90 jours
- [ ] Roadmap 12 mois
- [ ] Tagline définie
- [ ] Section Capture/Démo préparée
- [ ] Analyse stratégique complète
- [ ] Recommandation de positionnement

---

**Document préparé pour:** Séance 20  
**Application:** Djassa - Marketplace Mobile Côte d'Ivoire  
**Statut:** ✅ Prêt à présenter

---

*"Djassa — Votre marché, dans votre poche. Achetez, vendez, prospérez."*
