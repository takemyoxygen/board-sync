import logger from '../logger';
import {
  CardCreated,
  Action,
  Card,
  CopyCardAction,
  ActionType,
  UpdateCustomFieldAction
} from '../model';
import * as trello from '../trello.client';
import { anotherBoard, Handler, mirrorCustomFieldsCache } from './common';

async function setMirroredCard(
  board: string,
  card: Card,
  mirror: Card
): Promise<Action | undefined> {
  const cf = await mirrorCustomFieldsCache.get(board);
  await trello.setCustomFieldValue(card.id, cf.id, mirror.id);
  const actions = await trello.getBoardActions<UpdateCustomFieldAction>(
    board,
    ActionType.UpdateCustomFieldItem
  );

  const matchingAction = actions.find(
    (a) =>
      a.data.card.id === card.id &&
      a.data.customFieldItem.value?.text === mirror.id
  );

  if (!matchingAction) {
    logger.warn('Unable to find action', {
      type: ActionType.UpdateCustomFieldItem,
      board,
      card: card.id
    });
  }

  return matchingAction;
}

async function getCopyingAction(list: string, card: Card): Promise<Action> {
  const actions = await trello.getListActions<CopyCardAction>(
    list,
    ActionType.CopyCard
  );

  const creationAction = actions.find((a) => a.data.card.id === card.id);

  if (!creationAction) {
    throw new Error(
      `Unable to find action which created a card ${card.id} "${card.name}"`
    );
  }

  return creationAction;
}

export const handleCreateCard: Handler<CardCreated> = async (
  event
): Promise<Action[]> => {
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

  logger.info('Setting CF value to track ID of the mirrored card');

  const cfActions = await Promise.all([
    setMirroredCard(
      event.action.data.board.id,
      event.action.data.card,
      createdCard
    ),
    setMirroredCard(syncToBoard, createdCard, event.action.data.card)
  ]);

  return [creationAction, ...(cfActions.filter((a) => !!a) as Action[])];
};
