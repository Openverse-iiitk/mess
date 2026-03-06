'use client';

import { format } from 'date-fns';
import type { Comment } from '@/types/database';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare } from 'lucide-react';

interface CommentThreadProps {
  comments: Comment[];
  loading: boolean;
}

export function CommentThread({ comments, loading }: CommentThreadProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="mb-2 h-8 w-8" />
        <p className="text-sm">No responses yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[300px]">
      <div className="space-y-3 pr-4">
        {comments.map((comment, index) => (
          <div key={comment.id}>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Mess Manager
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), 'dd MMM yyyy, h:mm a')}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
            </div>
            {index < comments.length - 1 && <Separator className="mt-3" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
