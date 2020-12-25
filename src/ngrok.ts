import env from './env';
import ngrok from 'ngrok';
import logger from './logger';

export async function start(): Promise<string> {
  const url = await ngrok.connect(env.PORT);
  logger.info(`ngrok connected: ${url}`);

  return url;
}
