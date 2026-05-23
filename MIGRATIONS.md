# Database Migrations

TypeORM migrations manage schema changes. All migration commands require `NODE_ENV` to load the correct `.env` file.

## Commands

### Generate Migration
Compares current entities against database and creates migration file.

```bash
NODE_ENV=development pnpm migration:generate src/database/migrations/FeatureName
```

Generates: `src/database/migrations/[timestamp]-FeatureName.ts`

### Run Migrations
Executes pending migrations against database.

```bash
# Development
NODE_ENV=development pnpm migration:run

# Production (explicit NODE_ENV required)
NODE_ENV=production pnpm migration:run
```

### Revert Last Migration
```bash
NODE_ENV=development pnpm migration:revert
```

### Show Migration Status
```bash
NODE_ENV=development pnpm migration:show
```

## NODE_ENV Requirement

- **Default:** If `NODE_ENV` is omitted, defaults to `development` and loads `.env.development`
- **Production:** Must explicitly set `NODE_ENV=production` to load `.env.production`
- **In Docker/Kubernetes:** Set `NODE_ENV` as environment variable before running migrations

## Workflow

1. Make entity changes in `src/**/*.entity.ts`
2. Generate migration: `NODE_ENV=development pnpm migration:generate --name=DescriptiveChange`
3. Review generated file in `src/database/migrations/`
4. Run migration: `NODE_ENV=development pnpm migration:run`
5. Commit migration file with code changes
