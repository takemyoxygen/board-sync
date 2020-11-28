import env from './env';
import { Event } from './model';
import * as trello from './trello.client';

let suspended = false;

function anotherBoard(board: string): string {
  return env.BOARDS.find((b) => b !== board)!;
}

export async function handle(event: Event) {
  console.log('Received a message of type', event.action?.type);

  if (suspended) {
    console.log('Action', event.action.type, 'id', event.action.id);
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
    suspended = true;

    const card = await trello.createCard(
      matchingList.id,
      event.action.data.card.name
    );

    const creationAction = await trello.getCreationAction(
      matchingList.id,
      card
    );

    console.log('List creation action: ', creationAction.id);
  }
}
