import { createClient } from '@/lib/supabase/client';
import type { Comment, CommentInsert } from '@/types/database';
import { getAnonId } from '@/hooks/useAnonId';
import type { ModerationResponse } from '@/lib/automod/types';

const supabase = createClient();

export async function getCommentsByComplaint(complaintId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as Comment[]) || [];
}

/** Error subclass carrying moderation details */
export class ModerationError extends Error {
  public response: ModerationResponse;
  constructor(response: ModerationResponse) {
    super(response.message);
    this.name = 'ModerationError';
    this.response = response;
  }
}

/**
 * Create a comment via the server moderation route.
 * Throws `ModerationError` if the comment is blocked/warned.
 */
export async function createComment(comment: CommentInsert): Promise<Comment> {
  const anonId = getAnonId();

  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Anon-Id': anonId,
    },
    body: JSON.stringify(comment),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ModerationError(data as ModerationResponse);
  }

  return data.comment as Comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
