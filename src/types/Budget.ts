import { Expense } from './Expense';

export type Budget = {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  expenses: Expense[];
};
