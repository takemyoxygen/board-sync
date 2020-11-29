import got, { HTTPError } from 'got/';
import env from './env';
import { URL } from 'url';
import { Named } from './model';

export async function createWebhook(callbackUrl: string, board: string) {
  try {
    console.log(
      `Creating a weebhook for URL ${callbackUrl} for board ${board}`
    );
    const respnse = await got.post(tokenUrl('/webhooks'), {
      json: {
        description: 'Board Sync webhook',
        callbackURL: callbackUrl,
        idModel: board
      }
    });

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
  return got.get(tokenUrl('/webhooks')).json<Webhook[]>();
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  console.log('Deleting webhook', webhookId);
  await got.delete(tokenUrl(`/webhooks/${webhookId}`));
}

function tokenUrl(path: string, query: Record<string, string> = {}): string {
  const url = new URL(
    `/1/tokens/${env.API_TOKEN}${path}`,
    'https://api.trello.com/'
  );

  const queryToApply = {
    key: env.API_KEY,
    ...query
  };

  Object.entries(queryToApply).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.href;
}

function restUrl(path: string, query: Record<string, string> = {}) {
  const url = new URL(path, 'https://api.trello.com');

  const queryToApply = {
    key: env.API_KEY,
    token: env.API_TOKEN,
    ...query
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
export async function createCardCopy(
  list: string,
  source: Card
): Promise<[Card, Action]> {
  const card = await got
    .post(restUrl(`/1/cards`), {
      json: {
        idCardSource: source.id,
        idList: list
      }
    })
    .json<Card>();

  const action = await getCopyingAction(list, card);

  return [card, action];
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

function getListActions(list: string, filter?: string): Promise<Action[]> {
  return got
    .get(restUrl(`/1/lists/${list}/actions`, filter ? { filter } : {}))
    .json<Action[]>();
}

async function getCopyingAction(list: string, card: Card): Promise<Action> {
  const actions = await getListActions(list, 'copyCard');

  const creationAction = actions.find((a) => a.data.card.id === card.id);

  if (!creationAction) {
    throw new Error(
      `Unable to find action which created a card ${card.id} "${card.name}"`
    );
  }

  return creationAction;
}
