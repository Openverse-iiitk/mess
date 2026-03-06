'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Expense, ExpenseFilters, ExpenseInsert, ExpenseUpdate, PaginationState } from '@/types/database';
import * as expenseService from '@/services/expenseService';

export function useExpenses(initialFilters?: ExpenseFilters) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters || {});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await expenseService.getExpenses(filters, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setExpenses(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (expense: ExpenseInsert) => {
    const newExpense = await expenseService.createExpense(expense);
    setExpenses((prev) => [newExpense, ...prev]);
    setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
    // Notify mess managers of the new expense (fire-and-forget)
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '💰 New Expense Added',
        body: `${expense.title} — ₹${expense.amount}`,
        url: '/?tab=expenses',
      }),
    }).catch(() => {});
    return newExpense;
  }, []);

  const editExpense = useCallback(async (id: string, updates: ExpenseUpdate) => {
    const updated = await expenseService.updateExpense(id, updates);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  const removeExpense = useCallback(async (id: string) => {
    await expenseService.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ExpenseFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  return {
    expenses,
    loading,
    error,
    filters,
    pagination,
    fetchExpenses,
    addExpense,
    editExpense,
    removeExpense,
    updateFilters,
    goToPage,
  };
}

export function useExpenseSummary() {
  const [summary, setSummary] = useState<{
    totalAmount: number;
    categoryBreakdown: Record<string, number>;
    monthlyTotal: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expenseService.getExpenseSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  return { summary, loading };
}
