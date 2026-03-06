'use client';

import { useState, useRef } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { uploadReceipt } from '@/services/expenseService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Loader2, Plus, Upload } from 'lucide-react';
import type { ExpenseCategory } from '@/types/database';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

interface AddExpenseDialogProps {
  onSuccess: () => void;
}

export function AddExpenseDialog({ onSuccess }: AddExpenseDialogProps) {
  const { addExpense } = useExpenses();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('groceries');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  function resetForm() {
    setTitle('');
    setDescription('');
    setAmount('');
    setCategory('groceries');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setReceiptFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let receiptUrl: string | null = null;
      let receiptPath: string | null = null;

      if (receiptFile) {
        const result = await uploadReceipt(receiptFile);
        receiptUrl = result.url;
        receiptPath = result.path;
      }

      await addExpense({
        title: title.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
        category,
        expense_date: new Date(expenseDate).toISOString(),
        receipt_image_url: receiptUrl,
        receipt_storage_path: receiptPath,
      });

      resetForm();
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-title">Title</Label>
              <Input
                id="add-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Vegetables"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-amount">Amount (₹)</Label>
              <Input
                id="add-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger id="add-category">
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
              <Label htmlFor="add-date">Date</Label>
              <Input
                id="add-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-receipt">Receipt <span className="text-xs text-muted-foreground font-normal">(Image / PDF / CSV)</span></Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  {receiptFile ? 'Change' : 'Upload'}
                </Button>
                {receiptFile && (
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {receiptFile.name}
                  </span>
                )}
              </div>
              <input
                ref={fileRef}
                id="add-receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.pdf,text/csv,.csv"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-description">Description (optional)</Label>
              <Textarea
                id="add-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details..."
                rows={2}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
