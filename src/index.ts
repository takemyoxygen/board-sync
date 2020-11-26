import * as webhooks from './webhooks';
import * as app from './app';
import * as ngrok from './ngrok';
import * as handler from './handler';

async function main() {
  const [url, callbackPath] = await Promise.all([
    ngrok.start(),
    app.start(handler.handle)
  ]);

  await webhooks.setup(`${url}${callbackPath}`);
}

main();
