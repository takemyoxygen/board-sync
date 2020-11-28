export type Named = {
  id: string;
  name: string;
};

export type CardCreated = {
  model: Named;
  action: {
    id: string;
    type: 'createCard';
    data: {
      card: Named;
      list: Named;
      board: Named;
    };
  };
};

export type Event = CardCreated;
