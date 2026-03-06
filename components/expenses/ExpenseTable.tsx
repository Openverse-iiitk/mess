'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses, useExpenseSummary } from '@/hooks/useExpenses';
import { ExpenseFiltersPanel } from '@/components/expenses/FiltersPanel';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { EditExpenseDialog } from '@/components/expenses/EditExpenseDialog';
import { ReceiptPreview } from '@/components/expenses/ReceiptPreview';
import { ExpenseAnalytics } from '@/components/expenses/ExpenseAnalytics';
import { exportExpensesToCSV } from '@/services/expenseService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3,
  MoreHorizontal,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Expense, ExpenseFilters } from '@/types/database';

const categoryColors: Record<string, string> = {
  groceries: 'bg-green-500/10 text-green-500 border-green-500/20',
  dairy: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  utilities: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  maintenance: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export function ExpenseTable() {
  const { isManager } = useAuth();
  const {
    expenses,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    goToPage,
    removeExpense,
    fetchExpenses,
  } = useExpenses();
  const { summary } = useExpenseSummary();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  function handleSort(column: ExpenseFilters['sortBy']) {
    if (filters.sortBy === column) {
      updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ sortBy: column, sortOrder: 'desc' });
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await removeExpense(id);
    } catch {
      // Error handled by hook
    } finally {
      setDeletingId(null);
    }
  }

  function handleExportCSV() {
    const csv = exportExpensesToCSV(expenses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold">₹{summary.totalAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold">₹{summary.monthlyTotal.toLocaleString()}</p>
          </div>
          <div className="hidden rounded-lg border bg-card p-3 sm:block">
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-xl font-bold">{pagination.total}</p>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ExpenseFiltersPanel filters={filters} onFilterChange={updateFilters} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
            <BarChart3 className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          {isManager && <AddExpenseDialog onSuccess={fetchExpenses} />}
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && summary && <ExpenseAnalytics summary={summary} />}

      {/* Table */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1">
                    Title
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="hidden cursor-pointer select-none sm:table-cell"
                  onClick={() => handleSort('expense_date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Receipt</TableHead>
                {isManager && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isManager ? 6 : 5} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isManager ? 6 : 5} className="h-32 text-center text-muted-foreground">
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        {expense.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {expense.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 md:hidden">
                          <Badge
                            variant="outline"
                            className={categoryColors[expense.category] || categoryColors.other}
                          >
                            {expense.category}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={categoryColors[expense.category] || categoryColors.other}
                      >
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ₹{Number(expense.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {format(new Date(expense.expense_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {expense.receipt_image_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewImage(expense.receipt_image_url)}
                        >
                          <ImageIcon className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {isManager && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {expense.receipt_image_url && (
                              <DropdownMenuItem onClick={() => setPreviewImage(expense.receipt_image_url)}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                View Receipt
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setEditingExpense(expense)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(expense.id)}
                              disabled={deletingId === expense.id}
                            >
                              {deletingId === expense.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {totalPages} ({pagination.total} records)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            fetchExpenses();
          }}
        />
      )}

      <ReceiptPreview
        imageUrl={previewImage}
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      />
    </div>
  );
}
