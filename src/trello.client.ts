import gotBase from 'got';
import env from './env';
import { URL } from 'url';
import {
  Named,
  CustomField,
  List,
  Webhook,
  Card,
  Action,
  UpdateCardData,
  CustomFieldItem,
  CardDetails
} from './model';
import logger from './logger';

const gotEx = gotBase.extend({
  hooks: {
    beforeError: [
      (err) => {
        if (err.response?.body) {
          err.message = `${err.response.statusCode} - ${err.message}: ${err.response.body}`;
        }

        return err;
      }
    ]
  }
});

export async function createWebhook(callbackUrl: string, board: string) {
  try {
    logger.info(
      `Creating a weebhook for URL ${callbackUrl} for board ${board}`
    );
    await gotEx.post(tokenUrl('/webhooks'), {
      json: {
        description: 'Board Sync webhook',
        callbackURL: callbackUrl,
        idModel: board
      }
    });

    logger.info('Webhook created: ');
  } catch (e) {
    logger.error('Creating webhook failed', { error: e });
  }
}

export function getWebhooks(): Promise<Webhook[]> {
  return gotEx.get(tokenUrl('/webhooks')).json<Webhook[]>();
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  logger.info('Deleting webhook', { webhookId });
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

export function getLists(board: string): Promise<List[]> {
  return gotEx.get(restUrl(`/1/boards/${board}/lists`)).json();
}

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

export async function createCardCopy(
  board: string,
  list: string,
  source: Card
): Promise<Card> {
  return gotEx
    .post(restUrl(`/1/cards`), {
      json: {
        idCardSource: source.id,
        idList: list
      }
    })
    .json<Card>();
}

export function getListActions<A = Action>(
  list: string,
  filter?: string
): Promise<A[]> {
  return gotEx
    .get(restUrl(`/1/lists/${list}/actions`, filter ? { filter } : {}))
    .json<A[]>();
}

export function getBoardActions<A = Action>(
  board: string,
  filter?: string
): Promise<A[]> {
  return gotEx
    .get(restUrl(`/1/board/${board}/actions`, filter ? { filter } : {}))
    .json<A[]>();
}

export function updateCard(
  card: string,
  update: UpdateCardData
): Promise<void> {
  return gotEx
    .put(restUrl(`/1/card/${card}`), {
      json: update
    })
    .json();
}

export function getCardCustomFieldItems(
  card: string
): Promise<CustomFieldItem[]> {
  return gotEx
    .get(restUrl(`/1/cards/${card}/customFieldItems`))
    .json<CustomFieldItem[]>();
}

export function getCard(card: string): Promise<CardDetails> {
  return gotEx.get(restUrl(`/1/card/${card}`)).json();
}
