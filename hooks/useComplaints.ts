'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Complaint, ComplaintInsert, ComplaintStatus, Comment, CommentInsert } from '@/types/database';
import * as complaintService from '@/services/complaintService';
import * as commentService from '@/services/commentService';
import { subscribeToComplaints, subscribeToComments, subscribeToComplaintUpdates } from '@/services/notificationService';

export function useComplaints(statusFilter?: ComplaintStatus | 'all') {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await complaintService.getComplaints(statusFilter);
      setComplaints(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    const unsubInsert = subscribeToComplaints((newComplaint) => {
      setComplaints((prev) => [newComplaint as unknown as Complaint, ...prev]);
    });

    const unsubUpdate = subscribeToComplaintUpdates((updated) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === (updated as { id: string }).id ? (updated as unknown as Complaint) : c))
      );
    });

    return () => {
      unsubInsert();
      unsubUpdate();
    };
  }, []);

  const addComplaint = useCallback(async (complaint: ComplaintInsert) => {
    const newComplaint = await complaintService.createComplaint(complaint);
    // Realtime will also fire, but we add immediately for optimistic UI
    setComplaints((prev) => [newComplaint, ...prev]);
    return newComplaint;
  }, []);

  const updateStatus = useCallback(async (id: string, status: ComplaintStatus) => {
    const updated = await complaintService.updateComplaintStatus(id, status);
    setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return {
    complaints,
    loading,
    error,
    fetchComplaints,
    addComplaint,
    updateStatus,
  };
}

export function useComments(complaintId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!complaintId) return;
    try {
      setLoading(true);
      const data = await commentService.getCommentsByComplaint(complaintId);
      setComments(data);
    } catch {
      // Silently fail for comments
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    if (complaintId) fetchComments();
  }, [complaintId, fetchComments]);

  useEffect(() => {
    if (!complaintId) return;
    const unsub = subscribeToComments(complaintId, (newComment) => {
      setComments((prev) => [...prev, newComment as unknown as Comment]);
    });
    return unsub;
  }, [complaintId]);

  const addComment = useCallback(async (comment: CommentInsert) => {
    const newComment = await commentService.createComment(comment);
    // Realtime subscription also handles this
    setComments((prev) => [...prev, newComment]);
    return newComment;
  }, []);

  return { comments, loading, addComment, fetchComments };
}
