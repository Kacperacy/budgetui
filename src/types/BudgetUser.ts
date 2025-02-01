export enum BudgetRole {
  Owner = 0,
  Manager = 1,
  Viewer = 2
}

export interface BudgetUser {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  role: BudgetRole;
}
