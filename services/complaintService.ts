import { createClient } from '@/lib/supabase/client';
import type { Complaint, ComplaintInsert, ComplaintStatus } from '@/types/database';

const supabase = createClient();

export async function getComplaints(
  statusFilter?: ComplaintStatus | 'all'
): Promise<Complaint[]> {
  let query = supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Complaint[]) || [];
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
