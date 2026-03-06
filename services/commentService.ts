import { createClient } from '@/lib/supabase/client';
import type { AuthorRole, Comment, CommentInsert } from '@/types/database';

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

  let authorId: string | null = null;
  let role: AuthorRole = 'viewer';

  if (user) {
    authorId = user.id;
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    role = (userData?.role as AuthorRole) ?? 'mess';
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      ...comment,
      author_id: authorId,
      author_role: role,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
