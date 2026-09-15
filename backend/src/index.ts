import { createApp } from './app';
import { config } from './config';
import { createDatabase } from './db/database';
import { migrate } from './db/migrate';
import { seed } from './db/seed';

/** Starts the API after preparing the local SQLite database. */
function start(): void {
  const database = createDatabase(config.DATABASE_PATH);
  migrate(database);
  seed(database);
  const app = createApp(database);
  app.listen(config.PORT, () => {
    console.info(`API listening on port ${config.PORT}`);
  });
}

start();
