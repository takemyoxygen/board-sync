import express from 'express';
import env from './env';
import { Server } from 'http';
import logger from './logger';

const callbackPath = '/callback';

export function start(handle: (event: any) => void): Promise<[string, Server]> {
  const app = express();

  app.use(express.json());

  app.get(callbackPath, (req, res) => {
    res.send('ok');
  });

  app.post(callbackPath, (req, res) => {
    handle(req.body);
    res.send('ok');
  });

  return new Promise((resolve) => {
    const server = app.listen(env.PORT, () => {
      logger.info(`Listening on port ${env.PORT}`);
      resolve([callbackPath, server]);
    });
  });
}
