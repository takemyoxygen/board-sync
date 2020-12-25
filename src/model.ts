export type Named = {
  id: string;
  name: string;
};

export type CardCreated = {
  model: Named;
  action: Action<'createCard'>;
};
export type Card = Named;

export type Event = CardCreated;

export type CustomField = Named;

export type List = Named;

export type Webhook = {
  id: string;
};

export type Action<Type = string> = {
  id: string;
  data: {
    card: Named;
    list: Named;
    board: Named;
  };
  type: Type;
};
