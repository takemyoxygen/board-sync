import { Event, ActionType } from '../model';
import { handleCreateCard } from './create.card';
import { Handler } from './common';
import fs from 'fs';

const handlers: Record<string, Handler<Event>> = {};

const defaultHandler: Handler<Event> = (event) => {
  const filePath = `./samples/${event.action.type}`;
  fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
  return Promise.resolve([]);
};

function registerHandler<T extends Event>(
  type: T['action']['type'],
  handler: Handler<T>
) {
  handlers[type] = handler as any;
}

export function getHandler<T extends Event>(evt: Event): Handler<T> {
  return handlers[evt.action.type] ?? defaultHandler;
}

registerHandler(ActionType.CreateCard, handleCreateCard);
