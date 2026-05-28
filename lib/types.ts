export type Tornado = {
  id: number;
  yr: number;
  mo: number;
  dy: number;
  tm: string;
  st: string;
  mag: number; // -9 = unknown, 0..5
  inj: number;
  fat: number;
  loss: number; // actual whole USD (1996+ only; pre-1996 SPC stored a category code, zeroed)
  slat: number;
  slon: number;
  elat: number;
  elon: number;
  len: number; // miles
  wid: number; // yards
  co: string[];
};

export type Meta = {
  count: number;
  yearMin: number;
  yearMax: number;
  states: string[];
  stateCounties: Record<string, string[]>;
  source: string;
  url: string;
};
