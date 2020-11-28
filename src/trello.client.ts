import got, { HTTPError } from 'got/';
import env from './env';
import { URL } from 'url';
import { Named } from './model';

export async function createWebhook(callbackUrl: string, board: string) {
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

type Webhook = {
  id: string;
};

export function getWebhooks(): Promise<Webhook[]> {
  return got
    .get(
      `https://api.trello.com/1/tokens/${env.API_TOKEN}/webhooks/?key=${env.API_KEY}`,
      {}
    )
    .json<Webhook[]>();
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  console.log('Deleting webhook', webhookId);
  await got.delete(
    `https://api.trello.com/1/tokens/${env.API_TOKEN}/webhooks/${webhookId}?key=${env.API_KEY}`
  );
}

function restUrl(path: string, query?: Record<string, string>) {
  const url = new URL(path, 'https://api.trello.com');

  const queryToApply = {
    key: env.API_KEY,
    token: env.API_TOKEN,
    ...(query ?? {})
  };

  Object.entries(queryToApply).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.href;
}

export type List = Named;
export function getLists(board: string): Promise<List[]> {
  return got.get(restUrl(`/1/boards/${board}/lists`)).json();
}

export type Card = Named;
export function createCard(list: string, name: string): Promise<Card> {
  return got
    .post(restUrl(`/1/cards`), {
      json: {
        name,
        idList: list
      }
    })
    .json();
}

export type Action = {
  id: string;
  data: {
    card: Named;
    list: Named;
    board: Named;
  };
  type: string;
};
export async function getCreationAction(
  list: string,
  card: Card
): Promise<Action> {
  const actions = await got
    .get(restUrl(`/1/lists/${list}/actions`, { filter: 'createCard' }))
    .json<Action[]>();

  const creationAction = actions.find(
    (a) => a.type === 'createCard' && a.data.card.id === card.id
  );

  if (!creationAction) {
    throw new Error(
      `Unable to find action which created a card ${card.id} "${card.name}"`
    );
  }

  return creationAction;
}
