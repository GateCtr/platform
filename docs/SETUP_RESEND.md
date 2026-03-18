# Configuration Resend - Guide Rapide

## Étape 1 : Créer un compte Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Cliquez sur "Start building"
3. Créez votre compte

## Étape 2 : Créer une clé API

1. Dans le dashboard Resend, allez dans **"API Keys"**
2. Cliquez sur "Create API Key"
3. Donnez un nom : **GateCtr Development**
4. Permissions : **Full access** (pour dev)
5. Cliquez sur "Create"
6. Copiez la clé : `re_XXXXXXXXXXXXXXXX`

⚠️ **Important** : La clé n'est affichée qu'une seule fois !

## Étape 3 : Configurer votre .env.local

Ajoutez à votre fichier `.env.local` :

```bash
RESEND_API_KEY="re_VOTRE_CLE_ICI"
EMAIL_FROM="GateCtr <noreply@gatectr.io>"
```

## Étape 4 : Tester l'envoi d'email

En développement, Resend permet d'envoyer des emails à votre propre adresse sans configuration de domaine.

1. Inscrivez-vous sur `/waitlist` avec votre email
2. Vérifiez votre boîte de réception
3. Vous devriez recevoir l'email de bienvenue

## Configuration production (domaine personnalisé)

### Ajouter votre domaine

1. Dans Resend Dashboard > **Domains**
2. Cliquez sur "Add Domain"
3. Entrez votre domaine : `gatectr.io`
4. Ajoutez les enregistrements DNS fournis :
   - SPF
   - DKIM
   - DMARC
5. Attendez la vérification (quelques minutes)

### Mettre à jour EMAIL_FROM

```bash
EMAIL_FROM="GateCtr <noreply@gatectr.io>"
```

## Limites

- **Plan gratuit** : 100 emails/jour, 3 000 emails/mois
- **Plan Pro** : 50 000 emails/mois à partir de $20/mois

Pour la Phase 0 (waitlist), le plan gratuit est suffisant.
