'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComplaints';
import { StatusBadge } from '@/components/complaints/StatusBadge';
import { CommentThread } from '@/components/complaints/CommentThread';
import { CommentInput } from '@/components/complaints/CommentInput';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Monitor, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Complaint, ComplaintStatus } from '@/types/database';

interface ComplaintCardProps {
  complaint: Complaint;
  onStatusChange: (id: string, status: ComplaintStatus) => void;
}

export function ComplaintCard({ complaint, onStatusChange }: ComplaintCardProps) {
  const { isManager } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const { comments, loading: commentsLoading, fetchComments } = useComments(
    expanded ? complaint.id : null
  );

  return (
    <Card className="transition-colors hover:border-foreground/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold leading-tight">{complaint.title}</h3>
            <p className="text-xs text-muted-foreground">
              {format(new Date(complaint.created_at), 'dd MMM yyyy, h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isManager ? (
              <Select
                value={complaint.status}
                onValueChange={(v) => onStatusChange(complaint.id, v as ComplaintStatus)}
              >
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <StatusBadge status={complaint.status} />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>

        {complaint.created_by_device && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/60">
            <Monitor className="h-3 w-3" />
            <span className="truncate max-w-[300px]">{complaint.created_by_device}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-3 pt-0">
        <Separator />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-1 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            {expanded ? comments.length : ''} response{comments.length !== 1 ? 's' : ''}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expanded && (
          <div className="space-y-3">
            <CommentThread comments={comments} loading={commentsLoading} />
            {isManager && (
              <CommentInput complaintId={complaint.id} onCommentAdded={fetchComments} />
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
