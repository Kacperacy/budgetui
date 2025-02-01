import { Expense } from './Expense';
import { BudgetRole } from './BudgetUser';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
  expenses: Expense[];
  currentUserRole: BudgetRole;
}
