import { createClient } from '@/lib/supabase/client';
import type { Complaint, ComplaintInsert, ComplaintStatus } from '@/types/database';

const supabase = createClient();

// Ensure session is restored from cookies before making queries
async function ensureAuth() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('Auth error during session restore:', error);
    }
    return user;
  } catch (err) {
    console.error('Error restoring auth session:', err);
    return null;
  }
}

export async function getComplaints(
  statusFilter?: ComplaintStatus | 'all'
): Promise<Complaint[]> {
  try {
    // Ensure auth session is restored before querying
    await ensureAuth();

    let query = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase complaint query error:', error);
      throw new Error(`Failed to fetch complaints: ${error.message}`);
    }
    return (data as Complaint[]) || [];
  } catch (err) {
    console.error('Error in getComplaints:', err);
    throw err;
  }
}

export async function getComplaintById(id: string): Promise<Complaint | null> {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Complaint;
}

export async function createComplaint(complaint: ComplaintInsert): Promise<Complaint> {
  const deviceInfo = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      ...complaint,
      created_by_device: deviceInfo,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Complaint;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus
): Promise<Complaint> {
  const { data, error } = await supabase
    .from('complaints')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Complaint;
}

export async function getComplaintStats(): Promise<{
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
}> {
  const { data, error } = await supabase
    .from('complaints')
    .select('status');

  if (error) throw error;

  const complaints = data || [];
  return {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    acknowledged: complaints.filter((c) => c.status === 'acknowledged').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };
}

export async function deleteComplaint(id: string): Promise<void> {
  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
