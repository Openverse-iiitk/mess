'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComplaints';
import { createComment, deleteComment } from '@/services/commentService';
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
import { ChevronDown, ChevronUp, Monitor, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Complaint, ComplaintStatus } from '@/types/database';

interface ComplaintCardProps {
  complaint: Complaint;
  onStatusChange: (id: string, status: ComplaintStatus) => void;
  onDelete?: (id: string) => void;
}

export function ComplaintCard({ complaint, onStatusChange, onDelete }: ComplaintCardProps) {
  const { isManager, isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [deletingComplaint, setDeletingComplaint] = useState(false);
  const { comments, loading: commentsLoading, fetchComments } = useComments(
    expanded ? complaint.id : null
  );

  const handleReply = useCallback(async (text: string, parentId?: string) => {
    await createComment({
      complaint_id: complaint.id,
      comment_text: text,
      parent_comment_id: parentId ?? null,
    });
    fetchComments();
  }, [complaint.id, fetchComments]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    await deleteComment(commentId);
    fetchComments();
  }, [fetchComments]);

  async function handleDeleteComplaint() {
    if (!onDelete) return;
    setDeletingComplaint(true);
    try {
      await onDelete(complaint.id);
    } finally {
      setDeletingComplaint(false);
    }
  }

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
            {isAdmin && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleDeleteComplaint}
                disabled={deletingComplaint}
              >
                {deletingComplaint ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
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
            {expanded ? `${comments.length} response${comments.length !== 1 ? 's' : ''}` : 'Responses'}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expanded && (
          <div className="space-y-3">
            <CommentThread
              comments={comments}
              loading={commentsLoading}
              onReply={handleReply}
              onDelete={isAdmin ? handleDeleteComment : undefined}
            />
            {isManager && (
              <CommentInput complaintId={complaint.id} onCommentAdded={fetchComments} />
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
