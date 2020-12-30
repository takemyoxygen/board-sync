import { pathToFileURL } from 'url';
import {
  ActionType,
  CardUpdated,
  ModelType,
  UpdateCardAction,
  UpdateCardData
} from '../model';
import { getList, getMirrorCardCustomField, Handler } from './common';
import * as trello from '../trello.client';

export const handleUpdateCard: Handler<CardUpdated> = async (event, logger) => {
  const changedFields = Object.keys(
    event.action.data.old
  ) as (keyof UpdateCardData)[];

  logger.info('Handling card update', {
    changedFields
  });

  const update = changedFields.reduce<UpdateCardData>((acc, key) => {
    const value = event.action.data.card[key];
    acc[key] = value as any;
    return acc;
  }, {});

  const cardCfs = await trello.getCardCustomFieldItems(
    event.action.data.card.id
  );

  const mirrorCf = await getMirrorCardCustomField(event.action.data.board.id);
  const mirrorCardId = cardCfs.find(
    (item) =>
      item.idCustomField === mirrorCf.id && item.modelType === ModelType.Card
  )?.value?.text;

  if (!mirrorCf) {
    logger.warn(`No ID of the card to mirror changes to`);
    return [];
  }

  const mirrorCard = await trello.getCard(mirrorCardId!);

  if (update.idList && event.action.data.listAfter) {
    const targetList = await getList(
      mirrorCard.idBoard,
      event.action.data.listAfter.name
    );
    if (!targetList) {
      logger.warn(
        'Unable to find list with matching name on the target board. Skipping the event',
        {
          targetBoard: mirrorCard.idBoard,
          targetListName: event.action.data.listAfter.name
        }
      );
      return [];
    }
    update.idList = targetList?.id;
  }

  logger.info('Updating the mirrorred card', { mirrorCardId });

  await trello.updateCard(mirrorCardId!, update);

  const cardUpdates = await trello.getBoardActions<UpdateCardAction>(
    mirrorCard.idBoard,
    ActionType.UpdateCard
  );

  const ownCardUpdateAction = cardUpdates.find(
    (upd) =>
      upd.data.card.id === mirrorCardId &&
      changedFields.every(
        (f) => upd.data.old.hasOwnProperty(f) && upd.data.card[f] === update[f]
      )
  );

  if (!ownCardUpdateAction) {
    logger.error('Unable to find just performed card update action');
    return [];
  }

  logger.info('Found just performed card update action');

  return [ownCardUpdateAction];
};
