import env from './env';
import ngrok from 'ngrok';

export async function start(): Promise<string> {
  const url = await ngrok.connect(env.PORT);
  console.log(`ngrok connected: ${url}`);

  return url;
}
