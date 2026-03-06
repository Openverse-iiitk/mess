'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import type { Comment } from '@/types/database';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Loader2,
  MessageSquare,
  Reply,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Shield,
  UserRound,
} from 'lucide-react';

interface CommentThreadProps {
  comments: Comment[];
  loading: boolean;
  onReply?: (text: string, parentId?: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

// Build a tree from flat comments using parent_comment_id
interface CommentNode {
  comment: Comment;
  children: CommentNode[];
}

function buildTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    map.set(c.id, { comment: c, children: [] });
  }

  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function CommentNode({
  node,
  depth,
  onReply,
  onDelete,
}: {
  node: CommentNode;
  depth: number;
  onReply?: (text: string, parentId?: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}) {
  const { isAdmin } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { comment } = node;
  const isAdminComment = comment.author_role === 'admin';
  const isMessComment = comment.author_role === 'mess';
  const isViewerComment = comment.author_role === 'viewer';

  async function handleReply() {
    if (!replyText.trim() || !onReply) return;
    setReplying(true);
    try {
      await onReply(replyText.trim(), comment.id);
      setReplyText('');
      setReplyOpen(false);
    } finally {
      setReplying(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={depth > 0 ? 'ml-4 border-l-2 border-border/50 pl-3' : ''}>
      <div className="group rounded-md py-2">
        {/* Author line */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className={isAdminComment ? 'bg-red-500/20 text-red-400 text-[10px]' : isViewerComment ? 'bg-muted text-muted-foreground text-[10px]' : 'bg-primary/20 text-primary text-[10px]'}>
              {isAdminComment ? <Shield className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
          <Badge
            variant={isAdminComment ? 'destructive' : isViewerComment ? 'outline' : 'secondary'}
            className="text-[10px] px-1.5 py-0"
          >
            {isAdminComment ? 'Admin' : isViewerComment ? 'Anonymous' : 'Manager'}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {node.children.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
          )}
        </div>

        {/* Comment body */}
        {!collapsed && (
          <>
            <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">
              {comment.comment_text}
            </p>

            {/* Actions */}
            <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setReplyOpen(!replyOpen)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {isAdmin && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Delete
                </Button>
              )}
            </div>

            {/* Inline reply box */}
            {replyOpen && (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setReplyOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-7 text-xs" disabled={replying || !replyText.trim()} onClick={handleReply}>
                    {replying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nested children */}
      {!collapsed && node.children.length > 0 && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <CommentNode key={child.comment.id} node={child} depth={depth + 1} onReply={onReply} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ comments, loading, onReply, onDelete }: CommentThreadProps) {
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

  const tree = buildTree(comments);

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-1 pr-4">
        {tree.map((node) => (
          <CommentNode key={node.comment.id} node={node} depth={0} onReply={onReply} onDelete={onDelete} />
        ))}
      </div>
    </ScrollArea>
  );
}
