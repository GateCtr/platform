# Clerk publicMetadata — Convention

## Règle absolue : toujours merger, jamais écraser

`publicMetadata` dans Clerk est un objet partagé entre plusieurs systèmes (onboarding, RBAC, feature flags, etc.). Écraser l'objet entier détruit les clés écrites par d'autres systèmes.

**Pattern obligatoire pour toute écriture dans `publicMetadata` :**

```ts
// ✅ CORRECT — read-then-merge
const clerkUser = await clerk.users.getUser(clerkId);
const existing = (clerkUser.publicMetadata as Record<string, unknown>) ?? {};
await clerk.users.updateUser(clerkId, {
  publicMetadata: { ...existing, myKey: myValue },
});

// ❌ INTERDIT — écrase toutes les autres clés
await clerk.users.updateUser(clerkId, {
  publicMetadata: { myKey: myValue },
});

// ❌ INTERDIT — updateUserMetadata avec publicMetadata partiel
await clerk.users.updateUserMetadata(clerkId, {
  publicMetadata: { myKey: myValue },
});
```

> Note : `updateUserMetadata` de Clerk fait un merge shallow en théorie, mais son comportement varie selon les versions. Utiliser `updateUser` avec merge explicite est plus sûr et plus lisible.

## Clés actuelles dans publicMetadata

| Clé                  | Type      | Écrit par                          | Lu par                        |
| -------------------- | --------- | ---------------------------------- | ----------------------------- |
| `onboardingComplete` | `boolean` | webhook `user.created`, `completeOnboarding()` | middleware `proxy.ts` |
| `role`               | `RoleName` | `setRole()`, `removeRole()`, `grant-super-admin.ts` | middleware `proxy.ts`, RBAC checks |

## Configuration Clerk Dashboard obligatoire

`publicMetadata` n'est **pas** inclus dans le session token par défaut. Il faut configurer le template manuellement :

1. Clerk Dashboard → **Sessions** → **Customize session token**
2. Dans le Claims editor, ajouter :

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

3. Cliquer **Save**

Sans cette configuration, `sessionClaims` ne contiendra jamais `metadata` → le middleware ne peut pas lire le rôle → access denied systématique.

> Note : après avoir sauvegardé le template, les sessions existantes doivent être régénérées (sign out + sign in) pour que le nouveau claim apparaisse dans le JWT.

## Règles pour ajouter une nouvelle clé

1. Ajouter la clé dans `types/globals.d.ts` → interface `CustomJwtSessionClaims.publicMetadata`
2. Toujours utiliser le pattern read-then-merge à l'écriture
3. Documenter la clé dans le tableau ci-dessus
4. Ne jamais stocker de données métier (IDs, emails, plans) — uniquement des flags système

## Fichiers concernés

Tout fichier qui appelle `clerk.users.updateUser` ou `clerk.users.updateUserMetadata` doit respecter cette convention :

- `app/[locale]/onboarding/_actions.ts`
- `app/[locale]/(admin)/admin/users/_actions.ts`
- `app/api/webhooks/clerk/route.ts`
- `scripts/grant-super-admin.ts`
- `scripts/fix-onboarding-metadata.ts`
