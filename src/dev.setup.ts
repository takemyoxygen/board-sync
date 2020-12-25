import * as webhooks from './webhooks';
import * as app from './app';
import * as ngrok from './ngrok';
import * as handler from './handler';
import logger from './logger';

async function main() {
  const [url, [callbackPath, server]] = await Promise.all([
    ngrok.start(),
    app.start(handler.handle)
  ]);

  await webhooks.setup(`${url}${callbackPath}`);

  logger.info('Closing server...');
  server.close(() => {
    logger.info('Server closed');
  });
}

main();
