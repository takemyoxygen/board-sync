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
  CopyCard = 'copyCard',
  UpdateCard = 'updateCard'
}

export type Action<Type = string, Data = {}, Card = Named> = {
  id: string;
  data: {
    card: Card;
    board: Named;
  } & Data;
  type: Type;
};

export type CopyCardAction = Action<ActionType.CopyCard>;

export type UpdateCardData = {
  name?: string;
  idList?: string;
  desc?: string;
  closed?: boolean;
  due?: string;
  dueComplete?: boolean;
};
export type UpdateCardAction = Action<
  ActionType.UpdateCard,
  { old: UpdateCardData },
  Named & UpdateCardData
>;

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

type BaseEvent<A = Action> = {
  model: Named;
  action: A;
};

export type CardCreated = BaseEvent<
  Action<ActionType.CreateCard, { list: Named }>
>;

export type UnsupportedEvent = BaseEvent;
export type CardUpdated = BaseEvent<UpdateCardAction>;

export type Event = CardCreated | CardUpdated | UnsupportedEvent;

export enum ModelType {
  Card = 'card',
  Board = 'board',
  Member = 'member'
}

export type CustomFieldItem = {
  id: string;
  idCustomField: string;
  value: { text?: string };
  modelType: ModelType;
};

export type CardDetails = Card & {
  idBoard: string;
  idList: string;
};
