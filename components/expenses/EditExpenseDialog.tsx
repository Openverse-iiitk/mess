'use client';

import { useState, useRef } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { uploadReceipt } from '@/services/expenseService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/types/database';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

interface EditExpenseDialogProps {
  expense: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditExpenseDialog({ expense, open, onOpenChange, onSuccess }: EditExpenseDialogProps) {
  const { editExpense } = useExpenses();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(expense.title);
  const [description, setDescription] = useState(expense.description || '');
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [expenseDate, setExpenseDate] = useState(
    new Date(expense.expense_date).toISOString().split('T')[0]
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let receiptUrl = expense.receipt_image_url;
      let receiptPath = expense.receipt_storage_path;

      if (receiptFile) {
        const result = await uploadReceipt(receiptFile);
        receiptUrl = result.url;
        receiptPath = result.path;
      }

      await editExpense(expense.id, {
        title: title.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
        category,
        expense_date: new Date(expenseDate).toISOString(),
        receipt_image_url: receiptUrl,
        receipt_storage_path: receiptPath,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription className="sr-only">
            Update the details of this expense record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount (₹)</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-receipt">Receipt <span className="text-xs text-muted-foreground font-normal">(Image / PDF / CSV)</span></Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  {receiptFile ? 'Change' : expense.receipt_image_url ? 'Replace' : 'Upload'}
                </Button>
                {(receiptFile || expense.receipt_image_url) && (
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {receiptFile?.name || 'Current receipt'}
                  </span>
                )}
              </div>
              <input
                ref={fileRef}
                id="edit-receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.pdf,text/csv,.csv"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
