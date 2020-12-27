import { pathToFileURL } from 'url';
import {
  CardUpdated,
  ModelType,
  UpdateCardAction,
  UpdateCardData
} from '../model';
import { getMirrorCardCustomField, Handler } from './common';
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

  logger.info('Updating the mirrorred card', { mirrorCardId });

  await trello.updateCard(mirrorCardId!, update);

  return [];
};
