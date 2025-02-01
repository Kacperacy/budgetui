export interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    description: string;
    createdBy: {
      id: string;
      username: string;
      email: string;
    };
  } | null;
  budgetId: string;
}
