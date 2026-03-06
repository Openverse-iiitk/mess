'use client';

import { useState } from 'react';
import { useComplaints } from '@/hooks/useComplaints';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Receipt, MessageSquareWarning } from 'lucide-react';
import type { ComplaintStatus } from '@/types/database';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('expenses');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const {
    complaints,
    loading: complaintsLoading,
    updateStatus,
    removeComplaint,
    fetchComplaints,
  } = useComplaints(statusFilter === 'all' ? undefined : statusFilter);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="expenses" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="complaints" className="gap-1.5">
            <MessageSquareWarning className="h-4 w-4" />
            <span className="hidden sm:inline">Complaints</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <ExpenseTable />
        </TabsContent>

        <TabsContent value="complaints">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ComplaintStatus | 'all')}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <ComplaintForm onSuccess={fetchComplaints} />
            </div>

            {complaintsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <MessageSquareWarning className="mb-2 h-10 w-10" />
                <p>No complaints found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onStatusChange={updateStatus}
                    onDelete={removeComplaint}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
