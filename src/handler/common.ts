import env from '../env';
import CachedStore from '../cache';
import logger, { Logger } from '../logger';
import { Action, CustomField, Event, List } from '../model';
import * as trello from '../trello.client';

const mirrorCardCustomFieldName = 'MirrorCard';

export async function getMirrorCardCustomField(
  board: string
): Promise<CustomField> {
  logger.info('Getting Custom Fields', { board });

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

export const mirrorCustomFieldsCache = new CachedStore(
  10 * 60,
  getMirrorCardCustomField
);

export function anotherBoard(board: string): string {
  return env.BOARDS.find((b) => b !== board)!;
}

export type Handler<T extends Event> = (
  event: T,
  logger: Logger
) => Promise<Action[]>;

export async function getList(
  board: string,
  listName: string
): Promise<List | undefined> {
  const lists = await trello.getLists(board);

  return lists.find((l) => l.name === listName);
}
