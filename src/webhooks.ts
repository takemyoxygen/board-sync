import env from './env';
import * as trello from './trello.client';

async function deleteOldWebhooks() {
  const existingWebhooks = await trello.getWebhooks();

  for (const webhook of existingWebhooks) {
    await trello.deleteWebhook(webhook.id);
  }
}

async function createWebhooks(callbackUrl: string) {
  for (const board of env.BOARDS) {
    await trello.createWebhook(callbackUrl, board);
  }
}

export async function setup(callbackUrl: string) {
  await deleteOldWebhooks();
  await createWebhooks(callbackUrl);
}
