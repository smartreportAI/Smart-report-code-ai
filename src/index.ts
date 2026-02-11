import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { buildApp } from './app.js';
import { closeBrowser } from './services/pdf/browser-pool.service.js';

async function main() {
  await connectDb(env.MONGO_URI);

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info({ port: env.PORT }, 'Server listening');
  } catch (err) {
    app.log.error(err);
    await closeBrowser();
    await disconnectDb();
    process.exit(1);
  }
}

const shutdown = async () => {
  await closeBrowser();
  await disconnectDb();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
