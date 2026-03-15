# Configuration Clerk - Guide Rapide

## Étape 1 : Créer un compte Clerk

1. Allez sur [https://clerk.com](https://clerk.com)
2. Cliquez sur "Start building for free"
3. Créez votre compte (Email, Google, ou GitHub)

## Étape 2 : Créer une application

1. Dans le dashboard Clerk, cliquez sur "Create application"
2. Donnez un nom : **GateCtr**
3. Choisissez les méthodes d'authentification :
   - ✅ Email
   - ✅ Google (recommandé)
   - ✅ GitHub (recommandé)
4. Cliquez sur "Create application"

## Étape 3 : Récupérer les clés API

1. Dans le dashboard, allez dans **"API Keys"** (menu de gauche)
2. Vous verrez deux clés :
   - **Publishable key** : `pk_test_XXXXXXX...`
   - **Secret key** : `sk_test_XXXXXXX...`
3. Copiez ces deux clés

## Étape 4 : Configurer votre .env.local

Créez un fichier `.env.local` à la racine du projet :

```bash
# Collez vos clés Clerk ici
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_VOTRE_CLE_ICI"
CLERK_SECRET_KEY="sk_test_VOTRE_CLE_ICI"

# URLs de redirection (ne pas modifier)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
```

## Étape 5 : Tester

1. Redémarrez votre serveur de développement :
   ```bash
   pnpm dev
   ```

2. L'erreur "Publishable key not valid" devrait disparaître

## Configuration avancée (optionnel)

### Personnaliser l'apparence

Dans Clerk Dashboard > **Customization** :
- Logo
- Couleurs
- Thème (light/dark)

### Configurer les webhooks

Pour synchroniser les utilisateurs Clerk avec votre DB :

1. Dans Clerk Dashboard > **Webhooks**
2. Créez un endpoint : `https://votre-domaine.com/api/webhooks/clerk`
3. Sélectionnez les événements :
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copiez le **Signing Secret** : `whsec_...`
5. Ajoutez à `.env.local` :
   ```bash
   CLERK_WEBHOOK_SECRET="whsec_VOTRE_SECRET"
   ```
