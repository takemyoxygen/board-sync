import { Event } from '../model';
import async from 'async';
import logger from '../logger';
import { getHandler } from './registry';

const queue = async.queue(processEvent);
const ownActions = new Set<string>();

async function processEvent(event: Event): Promise<void> {
  const eventLogger = logger.child({
    type: event.action?.type,
    action: event.action.id,
    card: event.action.data.card.id
  });

  try {
    eventLogger.info('Event processing started');

    if (ownActions.has(event.action.id)) {
      eventLogger.info(
        'This event was originated from board sync, skipping it',
        {
          action: event.action.id
        }
      );
      return;
    }

    const handler = getHandler(event);
    const actions = await handler(event, eventLogger);
    actions.forEach((a) => ownActions.add(a.id));
  } catch (e) {
    eventLogger.error(`Failed to process event`, {
      error: e,
      type: event.action.type,
      action: event.action.id
    });
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
