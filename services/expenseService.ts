import { createClient } from '@/lib/supabase/client';
import type { Expense, ExpenseInsert, ExpenseUpdate, ExpenseFilters, PaginationState } from '@/types/database';

const supabase = createClient();

export async function getExpenses(
  filters: ExpenseFilters = {},
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
): Promise<{ data: Expense[]; pagination: PaginationState }> {
  let query = supabase
    .from('expenses')
    .select('*', { count: 'exact' });

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters.dateFrom) {
    query = query.gte('expense_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('expense_date', filters.dateTo);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const sortBy = filters.sortBy || 'expense_date';
  const sortOrder = filters.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data as Expense[]) || [],
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: count || 0,
    },
  };
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function createExpense(expense: ExpenseInsert): Promise<Expense> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expense, added_by: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(id: string, updates: ExpenseUpdate): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/csv', 'application/vnd.ms-excel'];
const MAX_SIZE_MB = 10;

export async function uploadReceipt(file: File): Promise<{ url: string; path: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only images (JPG, PNG, WEBP), PDF, and CSV files are allowed.');
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File size must be under ${MAX_SIZE_MB}MB.`);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `receipts/${fileName}`;

  const { error } = await supabase.storage
    .from('mess-receipts')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('mess-receipts')
    .getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
}

export async function deleteReceipt(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('mess-receipts')
    .remove([path]);

  if (error) throw error;
}

export async function getExpenseSummary(): Promise<{
  totalAmount: number;
  categoryBreakdown: Record<string, number>;
  monthlyTotal: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: allExpenses, error } = await supabase
    .from('expenses')
    .select('amount, category, expense_date');

  if (error) throw error;

  const expenses = allExpenses || [];
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const categoryBreakdown: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount);
  });

  const monthlyTotal = expenses
    .filter((e) => e.expense_date >= startOfMonth)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return { totalAmount, categoryBreakdown, monthlyTotal };
}

export function exportExpensesToCSV(expenses: Expense[]): string {
  const headers = ['Title', 'Description', 'Amount', 'Category', 'Date', 'Receipt URL'];
  const rows = expenses.map((e) => [
    e.title,
    e.description || '',
    e.amount.toString(),
    e.category,
    new Date(e.expense_date).toLocaleDateString(),
    e.receipt_image_url || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}
