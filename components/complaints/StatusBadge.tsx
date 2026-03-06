'use client';

import type { ComplaintStatus } from '@/types/database';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  },
  acknowledged: {
    label: 'Acknowledged',
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
};

interface StatusBadgeProps {
  status: ComplaintStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
