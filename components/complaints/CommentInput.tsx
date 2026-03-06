'use client';

import { useState, useEffect, useRef } from 'react';
import { createComment, ModerationError } from '@/services/commentService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, AlertTriangle, Ban } from 'lucide-react';

interface CommentInputProps {
  complaintId: string;
  onCommentAdded: () => void;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return '';
  const secs = Math.ceil(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.ceil(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.ceil(mins / 60);
  return `${hrs}h`;
}

export function CommentInput({ complaintId, onCommentAdded }: CommentInputProps) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modMessage, setModMessage] = useState<string | null>(null);
  const [modLevel, setModLevel] = useState<'warn' | 'mute' | 'block' | null>(null);
  const [muteRemaining, setMuteRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  // Countdown timer for mutes
  useEffect(() => {
    if (muteRemaining <= 0) return;
    timerRef.current = setInterval(() => {
      setMuteRemaining((prev) => {
        if (prev <= 1000) {
          if (timerRef.current) clearInterval(timerRef.current);
          setModMessage(null);
          setModLevel(null);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [muteRemaining]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);
    setModMessage(null);
    setModLevel(null);
    setLoading(true);

    try {
      await createComment({
        complaint_id: complaintId,
        comment_text: body.trim(),
      });
      setBody('');
      onCommentAdded();
    } catch (err) {
      if (err instanceof ModerationError) {
        const { penalty, message } = err.response;
        if (penalty) {
          const action = penalty.action;
          if (action === 'warning' || action === 'final_warning') {
            setModLevel('warn');
            setModMessage(penalty.message);
          } else if (action === 'block_24h') {
            setModLevel('block');
            setModMessage(penalty.message);
          } else {
            // muted
            setModLevel('mute');
            setModMessage(penalty.message);
            if (penalty.mutedUntil) {
              setMuteRemaining(new Date(penalty.mutedUntil).getTime() - Date.now());
            }
          }
        } else {
          setModMessage(message);
          setModLevel('block');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to add comment');
      }
    } finally {
      setLoading(false);
    }
  }

  const isMuted = modLevel === 'mute' && muteRemaining > 0;
  const isBlocked = modLevel === 'block';

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isMuted ? `Muted — try again in ${formatCountdown(muteRemaining)}` : isBlocked ? 'You are blocked from commenting' : 'Write a response...'}
        rows={2}
        required
        disabled={isMuted || isBlocked}
      />

      {modMessage && (
        <div className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
          modLevel === 'warn' ? 'border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
          'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300'
        }`}>
          {modLevel === 'warn' ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>{modMessage}{isMuted ? ` (${formatCountdown(muteRemaining)} remaining)` : ''}</span>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={loading || !body.trim() || isMuted || isBlocked}>
          {loading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1 h-4 w-4" />
          )}
          Reply
        </Button>
      </div>
    </form>
  );
}
