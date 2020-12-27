import env from '../env';
import CachedStore from '../cache';
import logger from '../logger';
import { Action, CustomField, Event } from '../model';
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

export type Handler<T extends Event> = (event: T) => Promise<Action[]>;
