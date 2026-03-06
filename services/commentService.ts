import { createClient } from '@/lib/supabase/client';
import type { Comment, CommentInsert } from '@/types/database';

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

export async function createComment(comment: CommentInsert): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      ...comment,
      author_id: user.id,
      author_role: 'mess' as const,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Comment;
}
