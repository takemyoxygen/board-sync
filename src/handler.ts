import env from './env';
import { Event } from './model';
import * as trello from './trello.client';
import async from 'async';

const queue = async.queue(processEvent);
const ownActions = new Set<string>();

function anotherBoard(board: string): string {
  return env.BOARDS.find((b) => b !== board)!;
}

async function processEvent(event: Event): Promise<void> {
  try {
    console.log('Received a message of type', event.action?.type);

    if (ownActions.has(event.action.id)) {
      console.log('This event was originated from board sync, skipping it');
      return;
    }

    if (event.action.type === 'createCard') {
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

        return;
      }

      console.log('Creating card in destination');

      const [, action] = await trello.createCardCopy(
        matchingList.id,
        event.action.data.card
      );

      console.log('List creation action: ', action.id);

      ownActions.add(action.id);
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
