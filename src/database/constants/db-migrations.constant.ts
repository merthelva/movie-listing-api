import { InitialSchema1779552504166 } from '../migrations/1779552504166-InitialSchema';
import { JoinTableConstraints1794604737000 } from '../migrations/1794604737000-JoinTableConstraints';

// Explicit class list (not a glob): the production build is bundled by webpack
// into dist/main.js, so a `*.ts` glob would match nothing there.
// RULE: every new migration class MUST be added here, otherwise it silently
// never runs in production (migrationsRun: true is the only runner there).
export const DB_MIGRATIONS = [
  InitialSchema1779552504166,
  JoinTableConstraints1794604737000,
];
