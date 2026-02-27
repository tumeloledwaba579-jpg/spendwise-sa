export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  monthly_budget?: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface Expense {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  transaction_date: string;
  description: string;
  notes: string | null;
  is_transfer: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string | null;
  
  // Populated relationships
  account?: Account;
  category?: Category;
}

export interface ExpenseFilters {
  account_id?: string;
  category_id?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  is_transfer?: boolean;
  is_recurring?: boolean;
  skip?: number;
  limit?: number;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  average: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
}