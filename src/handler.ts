import env from './env';
import { CardCreated, Event, Action, Card, CustomField } from './model';
import * as trello from './trello.client';
import async from 'async';
import fs from 'fs';
import logger from './logger';

const queue = async.queue(processEvent);
const ownActions = new Set<string>();

function anotherBoard(board: string): string {
  return env.BOARDS.find((b) => b !== board)!;
}

const mirrorCardCustomFieldName = 'MirrorCard';

async function handleCreateCard(event: CardCreated): Promise<Action[]> {
  async function getMirrorCardCustomField(board: string): Promise<CustomField> {
    const customFields = await trello.getCustomFields(board);
    const mirrorCf = customFields.find(
      (cf) => cf.name === mirrorCardCustomFieldName
    );

    if (!mirrorCf) {
      throw new Error(
        `Custom Field ${mirrorCardCustomFieldName} not found on board ${board}`
      );
    }

    return mirrorCf;
  }

  async function getCopyingAction(list: string, card: Card): Promise<Action> {
    const actions = await trello.getListActions(list, 'copyCard');

    const creationAction = actions.find((a) => a.data.card.id === card.id);

    if (!creationAction) {
      throw new Error(
        `Unable to find action which created a card ${card.id} "${card.name}"`
      );
    }

    return creationAction;
  }

  const syncToBoard = anotherBoard(event.action.data.board.id);
  const lists = await trello.getLists(syncToBoard);

  logger.info(
    `Found ${lists.length} on board ${syncToBoard} where new card should be created`
  );

  const matchingList = lists.find(
    (list) => list.name === event.action.data.list.name
  );

  if (!matchingList) {
    logger.info(
      `No list named "${event.action.data.list.name}" found on board ${syncToBoard}. Skipping this event.`
    );

    return [];
  }

  logger.info('Creating card in destination');

  const createdCard = await trello.createCardCopy(
    syncToBoard,
    matchingList.id,
    event.action.data.card
  );

  const creationAction = await getCopyingAction(matchingList.id, createdCard);

  const [sourceCardCf, createdCardCf] = await Promise.all([
    getMirrorCardCustomField(event.action.data.board.id),
    getMirrorCardCustomField(syncToBoard)
  ]);

  await Promise.all([
    trello.setCustomFieldValue(
      event.action.data.card.id,
      sourceCardCf.id,
      createdCard.id
    ),
    trello.setCustomFieldValue(
      createdCard.id,
      createdCardCf.id,
      event.action.data.card.id
    )
  ]);

  logger.info('List creation action: ', creationAction.id);

  return [creationAction];
}

async function defaultHandler(event: Event) {
  const filePath = `./samples/${event.action.type}`;
  fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
}

async function processEvent(event: Event): Promise<void> {
  try {
    logger.info('Received a message of type', event.action?.type);

    if (ownActions.has(event.action.id)) {
      logger.info('This event was originated from board sync, skipping it');
      return;
    }

    if (event.action.type === 'createCard') {
      const actions = await handleCreateCard(event);
      actions.forEach((a) => ownActions.add(a.id));
    } else {
      defaultHandler(event);
    }
  } catch (e) {
    logger.error(`Failed to process event ${event.action.type}`, e);
    throw e;
  }
}

export async function handle(event: Event): Promise<void> {
  return new Promise((resolve, reject) => {
    queue.push(event, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
