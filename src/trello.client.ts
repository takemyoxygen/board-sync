import gotBase, { HTTPError, HandlerFunction } from 'got';
import env from './env';
import { URL } from 'url';
import { Named } from './model';
import logger from './logger';

const errorConverter: HandlerFunction = async (options, next) => {
  try {
    return await next(options);
  } catch (e) {
    if (e instanceof HTTPError) {
      throw new Error(`${e.code} - ${e.message}: ${e.response.body}`);
    }
    throw e;
  }
};

const gotEx = gotBase.extend({
  handlers: [errorConverter]
});

export async function createWebhook(callbackUrl: string, board: string) {
  try {
    logger.info(
      `Creating a weebhook for URL ${callbackUrl} for board ${board}`
    );
    const respnse = await gotEx.post(tokenUrl('/webhooks'), {
      json: {
        description: 'Board Sync webhook',
        callbackURL: callbackUrl,
        idModel: board
      }
    });

    logger.info('Webhook created: ', respnse.body);
  } catch (e) {
    logger.error('Creating webhook failed', e);
  }
}

type Webhook = {
  id: string;
};

export function getWebhooks(): Promise<Webhook[]> {
  return gotEx.get(tokenUrl('/webhooks')).json<Webhook[]>();
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  logger.info('Deleting webhook', webhookId);
  await gotEx.delete(tokenUrl(`/webhooks/${webhookId}`));
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
  return gotEx.get(restUrl(`/1/boards/${board}/lists`)).json();
}

export type CustomField = Named;
export function getCustomFields(board: string): Promise<CustomField[]> {
  return gotEx.get(restUrl(`/1/boards/${board}/customFields`)).json();
}

export function setCustomFieldValue(
  card: string,
  customField: string,
  value: string
) {
  return gotEx
    .put(restUrl(`/1/cards/${card}/customField/${customField}/item`), {
      json: {
        value: { text: value }
      }
    })
    .json();
}

export type Card = Named;
export async function createCardCopy(
  board: string,
  list: string,
  source: Card
): Promise<[Card, Action]> {
  const card = await gotEx
    .post(restUrl(`/1/cards`), {
      json: {
        idCardSource: source.id,
        idList: list
      }
    })
    .json<Card>();

  const copyingAction = await getCopyingAction(list, card);

  return [card, copyingAction];
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
  return gotEx
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
