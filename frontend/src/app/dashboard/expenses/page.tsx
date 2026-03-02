'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import './expenses.css';

// Types
interface Category {
  id: string;
  name: string;
  category_type: string;
  description?: string;
  color?: string;
  icon?: string;
  is_system?: boolean;
  is_active?: boolean;
  display_order?: number;
  parent_id?: string | null;
  monthly_budget?: number;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  category_id: string | null;
  account_id: string;
  notes: string | null;
  is_recurring: boolean;
  created_at: string;
  
  // Populated fields
  category?: Category;
  account?: Account;
}

interface ExpenseFilters {
  start_date?: string;
  end_date?: string;
  category_id?: string;
  account_id?: string;
  search?: string;
}

export default function ExpensesPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  
  // Data states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [dateRange, setDateRange] = useState<'thisMonth' | 'lastMonth' | 'custom'>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
    is_recurring: false
  });

  // Summary stats
  const [totalSpent, setTotalSpent] = useState(0);
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});

  // Default categories to create if none exist - based on the Category model
  const defaultCategories = [
    { 
      name: 'Groceries', 
      category_type: 'EXPENSE',
      description: 'Food and grocery shopping',
      icon: '🛒',
      color: '#00C853',
      is_system: false,
      is_active: true,
      display_order: 1,
      parent_id: null
    },
    { 
      name: 'Transport', 
      category_type: 'EXPENSE',
      description: 'Fuel, public transport, parking',
      icon: '🚗',
      color: '#667eea',
      is_system: false,
      is_active: true,
      display_order: 2,
      parent_id: null
    },
    { 
      name: 'Entertainment', 
      category_type: 'EXPENSE',
      description: 'Movies, streaming, events',
      icon: '🎬',
      color: '#FF3D00',
      is_system: false,
      is_active: true,
      display_order: 3,
      parent_id: null
    },
    { 
      name: 'Utilities', 
      category_type: 'EXPENSE',
      description: 'Electricity, water, internet',
      icon: '💡',
      color: '#FFA000',
      is_system: false,
      is_active: true,
      display_order: 4,
      parent_id: null
    },
    { 
      name: 'Dining Out', 
      category_type: 'EXPENSE',
      description: 'Restaurants, takeaway, coffee shops',
      icon: '🍔',
      color: '#9C27B0',
      is_system: false,
      is_active: true,
      display_order: 5,
      parent_id: null
    },
    { 
      name: 'Shopping', 
      category_type: 'EXPENSE',
      description: 'Clothing, electronics, general shopping',
      icon: '🛍️',
      color: '#E91E63',
      is_system: false,
      is_active: true,
      display_order: 6,
      parent_id: null
    },
    { 
      name: 'Healthcare', 
      category_type: 'EXPENSE',
      description: 'Medical, pharmacy, insurance',
      icon: '🏥',
      color: '#00BCD4',
      is_system: false,
      is_active: true,
      display_order: 7,
      parent_id: null
    },
    { 
      name: 'Education', 
      category_type: 'EXPENSE',
      description: 'Courses, books, tuition',
      icon: '📚',
      color: '#3F51B5',
      is_system: false,
      is_active: true,
      display_order: 8,
      parent_id: null
    }
  ];

  // Default accounts to create if none exist - based on the Account model
  const defaultAccounts = [
    { 
      name: 'Main Checking', 
      account_type: 'CHECKING',
      balance: 0, 
      currency: 'ZAR', 
      is_active: true
    },
    { 
      name: 'Savings', 
      account_type: 'SAVINGS',
      balance: 0, 
      currency: 'ZAR', 
      is_active: true
    },
    { 
      name: 'Credit Card', 
      account_type: 'CREDIT_CARD',
      balance: 0, 
      currency: 'ZAR', 
      is_active: true
    },
    { 
      name: 'Investment', 
      account_type: 'INVESTMENT',
      balance: 0, 
      currency: 'ZAR', 
      is_active: true
    }
  ];

  // Helper to reset form
  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      account_id: accounts.length > 0 ? accounts[0].id : '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
      is_recurring: false
    });
  };

  // UUID validation helper
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadInitialData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      applyDateRangeFilter();
    }
  }, [dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [filters]);

  const createDefaultCategories = async (token: string) => {
    console.log('📝 Creating default categories...');
    const createdCategories: Category[] = [];
    
    for (const cat of defaultCategories) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cat)
        });
        
        if (response.ok) {
          const newCat = await response.json();
          createdCategories.push(newCat);
          console.log(`✅ Created category: ${cat.name}`);
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to create category ${cat.name}:`, response.status, errorText);
        }
      } catch (err) {
        console.error(`❌ Error creating category ${cat.name}:`, err);
      }
    }
    
    return createdCategories;
  };

  const createDefaultAccounts = async (token: string) => {
    console.log('📝 Creating default accounts...');
    const createdAccounts: Account[] = [];
    
    for (const acc of defaultAccounts) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(acc)
        });
        
        if (response.ok) {
          const newAcc = await response.json();
          createdAccounts.push(newAcc);
          console.log(`✅ Created account: ${acc.name}`);
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to create account ${acc.name}:`, response.status, errorText);
        }
      } catch (err) {
        console.error(`❌ Error creating account ${acc.name}:`, err);
      }
    }
    
    return createdAccounts;
  };

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      console.log('📡 Fetching categories and accounts...');

      const [categoriesRes, accountsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts`, { headers })
      ]);

      console.log('📊 Categories response status:', categoriesRes.status);
      console.log('📊 Accounts response status:', accountsRes.status);

      let finalCategories: Category[] = [];
      let finalAccounts: Account[] = [];

      // Handle Categories
      if (categoriesRes.ok) {
        const cats = await categoriesRes.json();
        console.log('✅ Categories loaded:', cats);
        
        if (cats.length === 0) {
          console.log('📝 No categories found, creating default ones...');
          finalCategories = await createDefaultCategories(token);
        } else {
          finalCategories = cats;
        }
      } else {
        console.error('❌ Failed to load categories, creating defaults...');
        finalCategories = await createDefaultCategories(token);
      }

      // Handle Accounts
      if (accountsRes.ok) {
        const accs = await accountsRes.json();
        console.log('✅ Accounts loaded:', accs);
        
        if (accs.length === 0) {
          console.log('📝 No accounts found, creating default ones...');
          finalAccounts = await createDefaultAccounts(token);
        } else {
          finalAccounts = accs;
        }
      } else {
        console.error('❌ Failed to load accounts, creating defaults...');
        finalAccounts = await createDefaultAccounts(token);
      }

      // If we created new categories, fetch them again to ensure we have all data
      if (finalCategories.length === 0) {
        const refreshCats = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/`, { headers });
        if (refreshCats.ok) {
          finalCategories = await refreshCats.json();
        }
      }

      // If we created new accounts, fetch them again to ensure we have all data
      if (finalAccounts.length === 0) {
        const refreshAccs = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/accounts`, { headers });
        if (refreshAccs.ok) {
          finalAccounts = await refreshAccs.json();
        }
      }

      setCategories(finalCategories);
      setAccounts(finalAccounts);
      
      // Set default account in form
      if (finalAccounts.length > 0) {
        setFormData(prev => ({ ...prev, account_id: finalAccounts[0].id }));
      }

      console.log('✅ Final categories:', finalCategories);
      console.log('✅ Final accounts:', finalAccounts);

      applyDateRangeFilter();
      
    } catch (err) {
      console.error('❌ Error loading initial data:', err);
      
      // Set mock data as fallback
      const mockCategories = [
        { id: '1', name: 'Groceries', category_type: 'EXPENSE', color: '#00C853' },
        { id: '2', name: 'Transport', category_type: 'EXPENSE', color: '#667eea' },
        { id: '3', name: 'Entertainment', category_type: 'EXPENSE', color: '#FF3D00' },
        { id: '4', name: 'Utilities', category_type: 'EXPENSE', color: '#FFA000' }
      ];
      
      const mockAccounts = [
        { id: 'acc1', name: 'Main Checking', account_type: 'CHECKING', balance: 15000, currency: 'ZAR', is_active: true },
        { id: 'acc2', name: 'Savings', account_type: 'SAVINGS', balance: 50000, currency: 'ZAR', is_active: true },
        { id: 'acc3', name: 'Credit Card', account_type: 'CREDIT_CARD', balance: -2500, currency: 'ZAR', is_active: true }
      ];
      
      setCategories(mockCategories);
      setAccounts(mockAccounts);
      setFormData(prev => ({ ...prev, account_id: mockAccounts[0].id }));
    }
  };

  const applyDateRangeFilter = () => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (dateRange === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (dateRange === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate).toISOString();
      endDate = new Date(customEndDate).toISOString();
    }

    setFilters(prev => ({
      ...prev,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    }));
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams();
      
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.account_id) params.append('account_id', filters.account_id);
      if (filters.search) params.append('search', filters.search);

      console.log('📡 Fetching expenses with params:', params.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Failed to fetch expenses: ${response.status}`);
      }

      const transactions = await response.json();
      console.log('✅ All transactions loaded:', transactions);
      
      const expenses = transactions.filter((t: Expense) => t.amount < 0);
      console.log('✅ Filtered expenses:', expenses);
      
      const enrichedExpenses = expenses.map((expense: Expense) => ({
        ...expense,
        category: categories.find(c => c.id === expense.category_id),
        account: accounts.find(a => a.id === expense.account_id)
      }));
      
      setExpenses(enrichedExpenses);
      
      const total = enrichedExpenses.reduce((sum: number, t: Expense) => sum + Math.abs(t.amount), 0);
      setTotalSpent(total);
      setExpenseCount(enrichedExpenses.length);

      const breakdown: Record<string, number> = {};
      enrichedExpenses.forEach((expense: Expense) => {
        const catId = expense.category_id || 'uncategorized';
        breakdown[catId] = (breakdown[catId] || 0) + Math.abs(expense.amount);
      });
      setCategoryBreakdown(breakdown);

      if (dateRange === 'thisMonth') {
        const now = new Date();
        const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const prevParams = new URLSearchParams();
        prevParams.append('start_date', prevStart.toISOString());
        prevParams.append('end_date', prevEnd.toISOString());
        
        const prevResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/?${prevParams.toString()}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (prevResponse.ok) {
          const prevTransactions = await prevResponse.json();
          const prevExpenses = prevTransactions.filter((t: Expense) => t.amount < 0);
          const prevTotal = prevExpenses.reduce((sum: number, t: Expense) => sum + Math.abs(t.amount), 0);
          setPreviousMonthTotal(prevTotal);
        }
      }

    } catch (err) {
      console.error('❌ Error fetching expenses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
      
      const mockExpenses = [
        {
          id: '1',
          amount: -1250.75,
          description: 'Checkers Groceries',
          transaction_date: new Date().toISOString(),
          category_id: categories[0]?.id || '1',
          account_id: accounts[0]?.id || 'acc1',
          notes: 'Weekly grocery run',
          is_recurring: false,
          created_at: new Date().toISOString(),
          category: categories[0] || { id: '1', name: 'Groceries', category_type: 'EXPENSE', color: '#00C853' },
          account: accounts[0] || { id: 'acc1', name: 'Main Checking', account_type: 'CHECKING', balance: 15000, currency: 'ZAR', is_active: true }
        },
        {
          id: '2',
          amount: -850.50,
          description: 'Eskom Electricity',
          transaction_date: new Date(Date.now() - 86400000).toISOString(),
          category_id: categories[3]?.id || '4',
          account_id: accounts[0]?.id || 'acc1',
          notes: 'Monthly electricity',
          is_recurring: true,
          created_at: new Date().toISOString(),
          category: categories[3] || { id: '4', name: 'Utilities', category_type: 'EXPENSE', color: '#FFA000' },
          account: accounts[0] || { id: 'acc1', name: 'Main Checking', account_type: 'CHECKING', balance: 15000, currency: 'ZAR', is_active: true }
        },
        {
          id: '3',
          amount: -199.00,
          description: 'Netflix Subscription',
          transaction_date: new Date(Date.now() - 172800000).toISOString(),
          category_id: categories[2]?.id || '3',
          account_id: accounts[2]?.id || 'acc3',
          notes: 'Monthly subscription',
          is_recurring: true,
          created_at: new Date().toISOString(),
          category: categories[2] || { id: '3', name: 'Entertainment', category_type: 'EXPENSE', color: '#FF3D00' },
          account: accounts[2] || { id: 'acc3', name: 'Credit Card', account_type: 'CREDIT_CARD', balance: -2500, currency: 'ZAR', is_active: true }
        }
      ];
      setExpenses(mockExpenses);
      
      const total = mockExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      setTotalSpent(total);
      setExpenseCount(mockExpenses.length);
      
      const breakdown: Record<string, number> = {};
      mockExpenses.forEach(expense => {
        const catId = expense.category_id || 'uncategorized';
        breakdown[catId] = (breakdown[catId] || 0) + Math.abs(expense.amount);
      });
      setCategoryBreakdown(breakdown);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      // Validate UUIDs
      if (formData.account_id && !isValidUUID(formData.account_id)) {
        throw new Error('Invalid account ID format');
      }
      if (formData.category_id && !isValidUUID(formData.category_id)) {
        throw new Error('Invalid category ID format');
      }

      const transactionData = {
        amount: -Math.abs(parseFloat(formData.amount)),
        description: formData.description,
        category_id: formData.category_id || null,
        account_id: formData.account_id,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        notes: formData.notes || null,
        is_recurring: formData.is_recurring,
        currency: 'ZAR'
      };

      console.log('📡 Adding expense:', JSON.stringify(transactionData, null, 2));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionData)
        }
      );

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to add expense';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const newExpense = JSON.parse(responseText);
      console.log('✅ Expense added:', newExpense);
      
      fetchExpenses();
      setShowAddModal(false);
      resetForm();

    } catch (err) {
      console.error('❌ Error adding expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      
      // Validate UUIDs
      if (formData.account_id && !isValidUUID(formData.account_id)) {
        throw new Error('Invalid account ID format');
      }
      if (formData.category_id && !isValidUUID(formData.category_id)) {
        throw new Error('Invalid category ID format');
      }

      const updateData = {
        amount: -Math.abs(parseFloat(formData.amount)),
        description: formData.description,
        category_id: formData.category_id || null,
        account_id: formData.account_id,
        transaction_date: new Date(formData.transaction_date).toISOString(),
        notes: formData.notes || null,
        is_recurring: formData.is_recurring
      };

      console.log('📡 Updating expense:', JSON.stringify(updateData, null, 2));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${selectedExpense.id}/`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to update expense';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const updatedExpense = JSON.parse(responseText);
      console.log('✅ Expense updated:', updatedExpense);

      fetchExpenses();
      setShowEditModal(false);
      setSelectedExpense(null);
      resetForm();

    } catch (err) {
      console.error('❌ Error updating expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      console.log('📡 Deleting expense:', selectedExpense.id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/transactions/${selectedExpense.id}/`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete expense';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Expense deleted');

      fetchExpenses();
      setShowDeleteModal(false);
      setSelectedExpense(null);

    } catch (err) {
      console.error('❌ Error deleting expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      amount: Math.abs(expense.amount).toString(),
      description: expense.description,
      category_id: expense.category_id || '',
      account_id: expense.account_id,
      transaction_date: expense.transaction_date.split('T')[0],
      notes: expense.notes || '',
      is_recurring: expense.is_recurring
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  const handleFilterChange = () => {
    setFilters({
      start_date: filters.start_date,
      end_date: filters.end_date,
      category_id: selectedCategory || undefined,
      account_id: selectedAccount || undefined,
      search: searchTerm || undefined
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string | null): string => {
    if (!categoryId) return '#999';
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#667eea';
  };

  const getMonthOverMonthChange = () => {
    if (previousMonthTotal === 0) return null;
    const change = ((totalSpent - previousMonthTotal) / previousMonthTotal) * 100;
    return {
      percent: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : 'down',
      color: change > 0 ? '#FF3D00' : '#00C853',
      amount: Math.abs(totalSpent - previousMonthTotal)
    };
  };

  if (authLoading || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading expenses...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const change = getMonthOverMonthChange();

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <Link href="/dashboard" className="navbar-brand">
          <span className="brand-logo">💰 SpendWise SA</span>
        </Link>
        
        <div className="navbar-links">
          <Link href="/dashboard" className="nav-link">📊 Dashboard</Link>
          <Link href="/dashboard/income" className="nav-link">💵 Income</Link>
          <Link href="/dashboard/expenses" className="nav-link active">💸 Expenses</Link>
          <Link href="/dashboard/budgets" className="nav-link">📋 Budgets</Link>
          <Link href="/dashboard/reports" className="nav-link">📈 Reports</Link>
        </div>
        
        <div className="navbar-user">
          <div className="user-avatar">
            {getInitials(user.full_name || user.email)}
          </div>
          <span className="user-name">
            {user.full_name || user.email.split('@')[0]}
          </span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="welcome-section fade-in">
          <div className="page-header-flex">
            <div>
              <h1 className="welcome-title">Expenses 💸</h1>
              <p className="welcome-subtitle">
                Track and analyze your spending habits.
              </p>
            </div>
            <div className="header-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                + Add Expense
              </button>
            </div>
          </div>
        </section>

        <div className="stats-grid fade-in">
          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Total Spent</h3>
              <div className="stat-icon">💰</div>
            </div>
            <div className="stat-value" style={{ color: '#FF3D00' }}>
              {formatCurrency(totalSpent)}
            </div>
            <div className="stat-trend">
              <span>
                {dateRange === 'thisMonth' ? 'This month' : 
                 dateRange === 'lastMonth' ? 'Last month' : 'Selected period'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">vs Last Month</h3>
              <div className="stat-icon">📊</div>
            </div>
            {change ? (
              <>
                <div className="stat-value" style={{ color: change.color }}>
                  {change.direction === 'up' ? '↑' : '↓'} {change.percent}%
                </div>
                <div className="stat-trend">
                  <span>{formatCurrency(change.amount)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-value">—</div>
                <div className="stat-trend">
                  <span>No data for comparison</span>
                </div>
              </>
            )}
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Transactions</h3>
              <div className="stat-icon">📝</div>
            </div>
            <div className="stat-value">{expenseCount}</div>
            <div className="stat-trend">
              <span>Total expenses</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Average</h3>
              <div className="stat-icon">📈</div>
            </div>
            <div className="stat-value">
              {expenseCount > 0 ? formatCurrency(totalSpent / expenseCount) : 'R0.00'}
            </div>
            <div className="stat-trend">
              <span>Per transaction</span>
            </div>
          </div>
        </div>

        <section className="filters-section fade-in">
          <div className="filters-row">
            <div className="filter-group">
              <label>Date Range</label>
              <select 
                className="filter-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="filter-group">
                  <label>From</label>
                  <input
                    type="date"
                    className="filter-input"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>To</label>
                  <input
                    type="date"
                    className="filter-input"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="filter-group">
              <label>Category</label>
              <select 
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="">All Categories</option>
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                ) : (
                  <option value="" disabled>Loading categories...</option>
                )}
              </select>
            </div>

            <div className="filter-group">
              <label>Account</label>
              <select 
                className="filter-select"
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="">All Accounts</option>
                {accounts.length > 0 ? (
                  accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))
                ) : (
                  <option value="" disabled>Loading accounts...</option>
                )}
              </select>
            </div>

            <div className="filter-group search-group">
              <label>Search</label>
              <div className="search-box">
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                />
                <button 
                  className="search-btn"
                  onClick={handleFilterChange}
                >
                  🔍
                </button>
              </div>
            </div>

            <button 
              className="btn-secondary refresh-btn"
              onClick={() => {
                setSelectedCategory('');
                setSelectedAccount('');
                setSearchTerm('');
                setDateRange('thisMonth');
                fetchExpenses();
              }}
            >
              🔄 Reset
            </button>
          </div>
        </section>

        {Object.keys(categoryBreakdown).length > 0 && (
          <section className="category-breakdown-section fade-in">
            <h2 className="section-title">Spending by Category</h2>
            <div className="category-breakdown-grid">
              {Object.entries(categoryBreakdown).map(([catId, amount]) => {
                const percentage = (amount / totalSpent) * 100;
                const categoryName = getCategoryName(catId === 'uncategorized' ? null : catId);
                const categoryColor = getCategoryColor(catId === 'uncategorized' ? null : catId);
                
                return (
                  <div key={catId} className="category-stat">
                    <div className="category-stat-header">
                      <span className="category-name">{categoryName}</span>
                      <span className="category-amount">{formatCurrency(amount)}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: categoryColor
                        }}
                      />
                    </div>
                    <span className="category-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="expenses-table-section fade-in">
          <h2 className="section-title">Expense List</h2>
          
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <h3>No expenses found</h3>
              <p>Add your first expense to start tracking your spending.</p>
              <button 
                className="btn-primary"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                + Add Expense
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Account</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.transaction_date)}</td>
                      <td>
                        <div className="expense-description">
                          {expense.description}
                          {expense.notes && (
                            <span className="expense-notes" title={expense.notes}>
                              📝
                            </span>
                          )}
                          {expense.is_recurring && (
                            <span className="recurring-badge" title="Recurring">
                              🔄
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {expense.category_id ? (
                          <span 
                            className="category-badge"
                            style={{ 
                              backgroundColor: getCategoryColor(expense.category_id) + '20',
                              color: getCategoryColor(expense.category_id),
                              borderColor: getCategoryColor(expense.category_id)
                            }}
                          >
                            {getCategoryName(expense.category_id)}
                          </span>
                        ) : (
                          <span className="category-badge uncategorized">
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td>{expense.account?.name || '—'}</td>
                      <td className="text-right expense-amount">
                        {formatCurrency(Math.abs(expense.amount))}
                      </td>
                      <td className="text-center">
                        <button 
                          className="btn-icon"
                          onClick={() => handleEditClick(expense)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => handleDeleteClick(expense)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} SpendWise SA. All rights reserved.</p>
        <p>Making financial management simple and effective for South Africans.</p>
      </footer>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Expense</h2>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>×</button>
            </div>
            
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label>Amount (ZAR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="250.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Grocery shopping, electricity bill, etc."
                  required
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Uncategorized</option>
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>Loading categories...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Account *</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                  required
                >
                  <option value="">Select an account</option>
                  {accounts.length > 0 ? (
                    accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>Loading accounts...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                  />
                  This is a recurring expense
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Expense</h2>
              <button className="modal-close" onClick={() => {
                setShowEditModal(false);
                setSelectedExpense(null);
                resetForm();
              }}>×</button>
            </div>
            
            <form onSubmit={handleUpdateExpense}>
              <div className="form-group">
                <label>Amount (ZAR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Uncategorized</option>
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>Loading categories...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Account *</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                  required
                >
                  <option value="">Select an account</option>
                  {accounts.length > 0 ? (
                    accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>Loading accounts...</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                  />
                  This is a recurring expense
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedExpense(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteModal(false);
          setSelectedExpense(null);
        }}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => {
                setShowDeleteModal(false);
                setSelectedExpense(null);
              }}>×</button>
            </div>
            
            <div className="delete-confirm-content">
              <p>Are you sure you want to delete this expense?</p>
              <p className="warning-text">This action cannot be undone.</p>
              {selectedExpense && (
                <div className="delete-preview">
                  <p><strong>{selectedExpense.description}</strong></p>
                  <p>{formatCurrency(Math.abs(selectedExpense.amount))}</p>
                  <p>{formatDate(selectedExpense.transaction_date)}</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedExpense(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={handleDeleteExpense}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
