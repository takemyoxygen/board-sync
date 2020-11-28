import * as webhooks from './webhooks';
import * as app from './app';
import * as ngrok from './ngrok';
import * as handler from './handler';

async function main() {
  const [url, [callbackPath, server]] = await Promise.all([
    ngrok.start(),
    app.start(handler.handle)
  ]);

  await webhooks.setup(`${url}${callbackPath}`);

  console.log('Closing server...');
  server.close(() => {
    console.log('Server closed');
  });
}

main();
