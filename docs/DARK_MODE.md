# Dark Mode avec next-themes

## Vue d'ensemble

GateCtr utilise `next-themes` pour gérer le dark mode avec un contrôle manuel et automatique. Le système supporte trois modes:

- **Light**: Mode clair
- **Dark**: Mode sombre
- **System**: Suit les préférences système de l'utilisateur

## Architecture

### 1. ThemeProvider

Le `ThemeProvider` enveloppe toute l'application et gère l'état du thème:

```tsx
// components/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### 2. Configuration dans le Layout

Le provider est configuré dans `app/layout.tsx`:

```tsx
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### Options du ThemeProvider

- `attribute="class"`: Utilise la classe `.dark` sur l'élément `<html>`
- `defaultTheme="system"`: Thème par défaut suit les préférences système
- `enableSystem`: Active la détection des préférences système
- `disableTransitionOnChange`: Désactive les transitions CSS lors du changement de thème (évite les animations indésirables)

### 3. Variables CSS

Les variables CSS sont définies pour les deux modes dans `app/globals.css`:

```css
/* Mode Light (défaut) */
:root {
  --background: #ffffff;
  --foreground: #4A5568;
  --primary: #1B4F82;
  --secondary: #00B4C8;
  /* ... */
}

/* Mode Dark (via @media) */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #14406A;
    --foreground: #EDF2F7;
    /* ... */
  }
}

/* Mode Dark (via classe) */
.dark {
  --background: #14406A;
  --foreground: #EDF2F7;
  --card: #1A202C;
  --card-foreground: #EDF2F7;
  /* ... */
}
```

**Note**: Les deux approches (`@media` et `.dark`) sont présentes pour supporter:
- Le mode system (via `@media`)
- Le mode manuel (via classe `.dark`)

## Composant ThemeToggle

Le composant `ThemeToggle` permet de basculer entre light et dark mode:

```tsx
// components/ui/theme-toggle.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 transition-all" />
      ) : (
        <Moon className="h-5 w-5 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

### Gestion de l'hydratation

Le composant utilise un état `mounted` pour éviter les problèmes d'hydratation:

1. Pendant le SSR et l'hydratation initiale, affiche un bouton désactivé
2. Une fois monté côté client, affiche le vrai toggle avec le thème actuel
3. Évite le flash de contenu incorrect (FOUC)

## Utilisation

### Dans un composant

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <header>
      <nav>
        {/* ... */}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

### Accéder au thème dans un composant

```tsx
"use client";

import { useTheme } from "next-themes";

export function MyComponent() {
  const { theme, setTheme, systemTheme } = useTheme();

  return (
    <div>
      <p>Thème actuel: {theme}</p>
      <p>Thème système: {systemTheme}</p>
      
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("system")}>System</button>
    </div>
  );
}
```

### Thème conditionnel

```tsx
"use client";

import { useTheme } from "next-themes";

export function ConditionalComponent() {
  const { theme } = useTheme();

  return (
    <div>
      {theme === "dark" ? (
        <DarkModeContent />
      ) : (
        <LightModeContent />
      )}
    </div>
  );
}
```

## Classes Tailwind pour le Dark Mode

Tailwind CSS détecte automatiquement la classe `.dark` et applique les styles correspondants:

```tsx
// Couleur de fond qui change selon le thème
<div className="bg-background text-foreground">
  Contenu
</div>

// Styles conditionnels avec dark:
<div className="bg-white dark:bg-grey-800">
  Contenu
</div>

<p className="text-grey-900 dark:text-grey-100">
  Texte
</p>

// Hover states avec dark mode
<button className="bg-primary hover:bg-primary-600 dark:bg-primary-700 dark:hover:bg-primary-600">
  Button
</button>
```

## Palette Dark Mode GateCtr

### Couleurs principales

| Variable | Light | Dark |
|----------|-------|------|
| `--background` | #ffffff | #14406A (Navy Deep) |
| `--foreground` | #4A5568 (Grey) | #EDF2F7 (Grey Light) |
| `--card` | #ffffff | #1A202C (Grey 800) |
| `--primary` | #1B4F82 (Navy) | #1B4F82 (Navy) |
| `--secondary` | #00B4C8 (Cyan) | #00B4C8 (Cyan) |
| `--muted` | #EDF2F7 | #2D3748 (Grey 700) |
| `--border` | #E2E8F0 | #2D3748 |

### Principes de design

1. **Contraste suffisant**: Ratio minimum de 4.5:1 pour le texte
2. **Cohérence**: Les couleurs primaires (Navy, Cyan) restent identiques
3. **Lisibilité**: Backgrounds sombres avec texte clair
4. **Hiérarchie**: Utilisation de `muted` pour les éléments secondaires

## Composants shadcn/ui

Tous les composants shadcn/ui supportent automatiquement le dark mode via les variables CSS:

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Ces composants s'adaptent automatiquement au thème
<Button variant="default">Primary Button</Button>
<Card>Card content</Card>
```

## Transitions

Par défaut, les transitions sont désactivées lors du changement de thème (`disableTransitionOnChange`). Pour activer les transitions:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange={false} // Activer les transitions
>
  {children}
</ThemeProvider>
```

Puis ajouter des transitions CSS:

```css
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

## Persistance

`next-themes` persiste automatiquement le choix de l'utilisateur dans `localStorage`:

- Clé: `theme`
- Valeurs possibles: `"light"`, `"dark"`, `"system"`

Le thème est restauré automatiquement lors des visites suivantes.

## SSR et Hydratation

### suppressHydrationWarning

L'attribut `suppressHydrationWarning` sur `<html>` est nécessaire car:

1. Le serveur ne connaît pas le thème de l'utilisateur
2. Le client applique le thème depuis `localStorage`
3. Cela peut créer une différence entre le HTML SSR et le HTML client

```tsx
<html lang="en" suppressHydrationWarning>
```

### Script de blocage

`next-themes` injecte automatiquement un script de blocage dans le `<head>` pour:

1. Lire le thème depuis `localStorage`
2. Appliquer la classe `.dark` avant le premier rendu
3. Éviter le flash de contenu incorrect (FOUC)

## Tests

### Test du toggle

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

test("toggle theme", () => {
  render(<ThemeToggle />);
  
  const button = screen.getByRole("button");
  fireEvent.click(button);
  
  // Vérifier que le thème a changé
});
```

### Test avec un thème spécifique

```tsx
import { ThemeProvider } from "@/components/theme-provider";

test("component in dark mode", () => {
  render(
    <ThemeProvider attribute="class" defaultTheme="dark">
      <MyComponent />
    </ThemeProvider>
  );
  
  // Assertions
});
```

## Troubleshooting

### Le thème ne change pas

Vérifiez que:
1. `ThemeProvider` enveloppe votre application
2. `suppressHydrationWarning` est sur `<html>`
3. Les variables CSS sont définies dans `:root` et `.dark`
4. `attribute="class"` est configuré dans le provider

### Flash de contenu incorrect (FOUC)

Si vous voyez un flash lors du chargement:
1. Vérifiez que `next-themes` est correctement installé
2. Le script de blocage doit être injecté automatiquement
3. Utilisez `disableTransitionOnChange` pour éviter les animations

### Les composants ne s'adaptent pas

Assurez-vous que:
1. Les composants utilisent les variables CSS (`bg-background`, `text-foreground`, etc.)
2. Les variables sont enregistrées dans `@theme` (Tailwind CSS 4)
3. Les classes `dark:` sont utilisées pour les styles conditionnels

## Ressources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [shadcn/ui Dark Mode Guide](https://ui.shadcn.com/docs/dark-mode)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [GateCtr Design System](./DESIGN_SYSTEM.md)
