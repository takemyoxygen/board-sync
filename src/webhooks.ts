import got, { HTTPError } from 'got';
import env from './env';

type Webhook = {
  id: string;
};

async function deleteOldWebhooks() {
  const existingWebhooks: Webhook[] = await got
    .get(
      `https://api.trello.com/1/tokens/${env.API_TOKEN}/webhooks/?key=${env.API_KEY}`,
      {}
    )
    .json();

  for (const webhook of existingWebhooks) {
    console.log('Deleting webhook', webhook.id);
    await got.delete(
      `https://api.trello.com/1/tokens/${env.API_TOKEN}/webhooks/${webhook.id}?key=${env.API_KEY}`
    );
  }
}

async function createWebhook(callbackUrl: string, board: string) {
  try {
    console.log(
      `Creating a weebhook for URL ${callbackUrl} for board ${board}`
    );
    const respnse = await got.post(
      `https://api.trello.com/1/tokens/${env.API_TOKEN}/webhooks/?key=${env.API_KEY}`,
      {
        json: {
          description: 'Board Sync webhook',
          callbackURL: callbackUrl,
          idModel: board
        }
      }
    );

    console.log('Webhook created: ', respnse.body);
  } catch (e) {
    if (e instanceof HTTPError) {
      console.error('Creating webhook failed', {
        statusCode: e.code,
        message: e.message,
        response: e.response.body
      });
    }
    console.error('Creating webhook failed', e);
  }
}

async function createWebhooks(callbackUrl: string) {
  for (const board of env.BOARDS) {
    await createWebhook(callbackUrl, board);
  }
}

export async function setup(callbackUrl: string) {
  await deleteOldWebhooks();
  await createWebhooks(callbackUrl);
}
