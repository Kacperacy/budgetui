import { Budget } from '@/types/Budget';

export const calculateRemainingBudget = (budget: Budget): number => {
  const totalExpenses = budget.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return budget.amount - totalExpenses;
};
