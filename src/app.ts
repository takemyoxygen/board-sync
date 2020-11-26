import express from 'express';
import env from './env';

const callbackPath = '/callback';

export function start(handle: (event: any) => void): Promise<string> {
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
    app.listen(env.PORT, () => {
      console.log(`Listening on port ${env.PORT}`);
      resolve(callbackPath);
    });
  });
}
