import env from './env';
import { CardCreated, Event } from './model';
import * as trello from './trello.client';
import async from 'async';
import fs from 'fs';

const queue = async.queue(processEvent);
const ownActions = new Set<string>();

function anotherBoard(board: string): string {
  return env.BOARDS.find((b) => b !== board)!;
}

const mirrorCardCustomFieldName = 'MirrorCard';

async function handleCreateCard(event: CardCreated): Promise<trello.Action[]> {
  async function getMirrorCardCustomField(
    board: string
  ): Promise<trello.CustomField> {
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

  const syncToBoard = anotherBoard(event.action.data.board.id);
  const lists = await trello.getLists(syncToBoard);

  console.log(
    `Found ${lists.length} on board ${syncToBoard} where new card should be created`
  );

  const matchingList = lists.find(
    (list) => list.name === event.action.data.list.name
  );

  if (!matchingList) {
    console.log(
      `No list named "${event.action.data.list.name}" found on board ${syncToBoard}. Skipping this event.`
    );

    return [];
  }

  console.log('Creating card in destination');

  const [createdCard, action] = await trello.createCardCopy(
    syncToBoard,
    matchingList.id,
    event.action.data.card
  );

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

  console.log('List creation action: ', action.id);

  return [action];
}

async function defaultHandler(event: Event) {
  const filePath = `./samples/${event.action.type}`;
  fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
}

async function processEvent(event: Event): Promise<void> {
  try {
    console.log('Received a message of type', event.action?.type);

    if (ownActions.has(event.action.id)) {
      console.log('This event was originated from board sync, skipping it');
      return;
    }

    if (event.action.type === 'createCard') {
      const actions = await handleCreateCard(event);
      actions.forEach((a) => ownActions.add(a.id));
    } else {
      defaultHandler(event);
    }
  } catch (e) {
    console.error(`Failed to process event ${event.action.type}`, e);
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
