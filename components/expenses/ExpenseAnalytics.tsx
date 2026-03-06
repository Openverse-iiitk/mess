'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpenseAnalyticsProps {
  summary: {
    totalAmount: number;
    categoryBreakdown: Record<string, number>;
    monthlyTotal: number;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  groceries: 'bg-green-500',
  dairy: 'bg-blue-500',
  utilities: 'bg-orange-500',
  maintenance: 'bg-purple-500',
  other: 'bg-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Groceries',
  dairy: 'Dairy',
  utilities: 'Utilities',
  maintenance: 'Maintenance',
  other: 'Other',
};

export function ExpenseAnalytics({ summary }: ExpenseAnalyticsProps) {
  const maxAmount = Math.max(...Object.values(summary.categoryBreakdown), 1);
  const sortedCategories = Object.entries(summary.categoryBreakdown).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCategories.map(([category, amount]) => {
            const percentage = summary.totalAmount > 0
              ? ((amount / summary.totalAmount) * 100).toFixed(1)
              : '0';

            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="text-muted-foreground">
                    ₹{amount.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${CATEGORY_COLORS[category] || 'bg-gray-500'}`}
                    style={{ width: `${(amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}

          {sortedCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">No expense data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
