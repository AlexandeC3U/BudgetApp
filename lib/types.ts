export type Member = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type Tab = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  members: Member[];
  budget: number;
  spent: number;
  currency: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export type Transaction = {
  id: string;
  tab: string;
  cat: string;
  title: string;
  amount: number;
  date: string;
  payer: string;
  split: string[];
};
