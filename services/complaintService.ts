import { createClient } from '@/lib/supabase/client';
import type { Complaint, ComplaintInsert, ComplaintStatus } from '@/types/database';
import { getAnonId } from '@/hooks/useAnonId';
import type { AnalysisResult } from '@/lib/automod/types';

const supabase = createClient();

export async function getComplaints(
  statusFilter?: ComplaintStatus | 'all'
): Promise<Complaint[]> {
  try {
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
  const anonId = getAnonId();

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      ...complaint,
      created_by_device: deviceInfo,
      anon_id: anonId || undefined,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Complaint;
}

/** Call the server analysis endpoint for live feedback while typing */
export async function analyzeText(text: string): Promise<AnalysisResult | null> {
  try {
    const res = await fetch('/api/moderation/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    return (await res.json()) as AnalysisResult;
  } catch {
    return null;
  }
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
