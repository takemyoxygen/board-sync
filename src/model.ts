export type Named = {
  id: string;
  name: string;
};

export type Card = Named;

export type CustomField = Named;

export type List = Named;

export type Webhook = {
  id: string;
};

export enum ActionType {
  CreateCard = 'createCard',
  UpdateCustomFieldItem = 'updateCustomFieldItem',
  CopyCard = 'copyCard'
}

export type Action<Type = string, Data = {}> = {
  id: string;
  data: {
    card: Named;
    board: Named;
  } & Data;
  type: Type;
};

type UpdateCustomFieldData = {
  customField: Named;
  customFieldItem: {
    id: string;
    value: {
      text?: string;
    } | null;
  };
};

export type UpdateCustomFieldAction = Action<
  ActionType.UpdateCustomFieldItem,
  UpdateCustomFieldData
>;

export type Event = CardCreated | UnsupportedEvent;

type BaseEvent<A = Action> = {
  model: Named;
  action: A;
};

export type CardCreated = BaseEvent<
  Action<ActionType.CreateCard, { list: Named }>
>;
export type CopyCardAction = Action<ActionType.CopyCard>;

export type UnsupportedEvent = BaseEvent;
