# Docker Setup - GateCtr

## Configuration complétée ✅

### Fichiers créés

1. **docker/Dockerfile** - Image de production multi-stage optimisée
2. **docker/Dockerfile.dev** - Image de développement avec hot reload
3. **docker-compose.yml** - Orchestration complète des services
4. **.dockerignore** - Exclusions pour optimiser le build
5. **.env.local** - Variables d'environnement (copié depuis .env.example)
6. **prisma/schema.prisma** - Schéma de base de données Prisma
7. **prisma.config.ts** - Configuration Prisma 7

### Services configurés

- **app** - Application Next.js avec hot reload
- **postgres** - PostgreSQL 16 avec healthcheck
- **redis** - Redis 7 avec persistence AOF
- **worker** - Worker BullMQ pour jobs asynchrones
- **stripe_cli** - CLI Stripe pour webhooks locaux (optionnel)
- **pgadmin** - Interface web pour PostgreSQL (optionnel)

### Tests effectués

✅ Configuration docker-compose validée
✅ Image Docker construite avec succès (1.69GB)
✅ PostgreSQL démarré et healthy
✅ Redis démarré et healthy

## Utilisation

### Démarrer tous les services

```bash
docker-compose up
```

### Démarrer en arrière-plan

```bash
docker-compose up -d
```

### Démarrer avec outils optionnels (Stripe CLI, pgAdmin)

```bash
docker-compose --profile tools up
```

### Arrêter les services

```bash
docker-compose down
```

### Voir les logs

```bash
docker-compose logs -f app
```

### Accès aux services

- **Application**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin** (avec --profile tools): http://localhost:5050
  - Email: admin@gatectr.io
  - Password: admin123

## Prochaines étapes

1. Configurer les variables d'environnement dans `.env.local`
2. Exécuter les migrations Prisma: `pnpm prisma migrate dev`
3. Démarrer l'application: `docker-compose up`
