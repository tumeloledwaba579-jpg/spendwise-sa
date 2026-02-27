export interface Budget {
  id: string;
  category_id: string;
  category_name: string;
  category_color?: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  period: 'monthly' | 'yearly';
  month?: number;
  year: number;
  created_at: string;
  updated_at?: string;
}

export interface BudgetCreate {
  category_id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  month?: number;
  year: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  total_remaining: number;
  average_percentage: number;
  categories_count: number;
  on_track_count: number;
  over_budget_count: number;
}