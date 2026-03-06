'use client';

import { useState, useEffect, useRef } from 'react';
import { useComplaints } from '@/hooks/useComplaints';
import { analyzeText } from '@/services/complaintService';
import type { AnalysisResult } from '@/lib/automod/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ComplaintFormProps {
  onSuccess?: () => void;
}

function SeverityBar({ severity }: { severity: number }) {
  const color =
    severity >= 6 ? 'bg-red-500' : severity >= 4 ? 'bg-orange-500' : severity >= 2 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(severity * 10, 100)}%` }} />
    </div>
  );
}

function ModerationFeedback({ analysis }: { analysis: AnalysisResult }) {
  const { profanity, sentiment, emotions, overallSeverity, suggestions } = analysis;
  const dominantEmotion = (Object.entries(emotions) as [string, number][]).reduce(
    (best, [k, v]) => (v > best[1] ? [k, v] : best),
    ['none', 0],
  );

  if (overallSeverity < 2) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <CheckCircle className="h-3.5 w-3.5" /> Content looks good
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-3 text-xs">
      <SeverityBar severity={overallSeverity} />
      {profanity.detected && (
        <p className="flex items-center gap-1 text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> Profanity detected — please reword
        </p>
      )}
      {dominantEmotion[1] > 0.5 && (
        <p className="flex items-center gap-1 text-muted-foreground">
          <Info className="h-3.5 w-3.5" /> Dominant tone: <span className="font-medium capitalize">{dominantEmotion[0]}</span>
        </p>
      )}
      {sentiment.label === 'negative' && sentiment.score < -3 && (
        <p className="text-muted-foreground">Tip: a calmer tone may get faster resolution.</p>
      )}
      {suggestions.length > 0 && (
        <ul className="list-disc pl-4 text-muted-foreground">
          {suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}

export function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const { addComplaint } = useComplaints();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced live analysis
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (description.trim().length < 10) {
      setAnalysis(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const result = await analyzeText(description);
      setAnalysis(result);
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [description]);

  function resetForm() {
    setTitle('');
    setDescription('');
    setError(null);
    setAnalysis(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await addComplaint({
        title: title.trim(),
        description: description.trim(),
      });

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Complaint
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a Complaint</DialogTitle>
          <DialogDescription className="sr-only">
            Describe the issue you are experiencing so mess managers can address it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complaint-title">Title</Label>
            <Input
              id="complaint-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-description">Description</Label>
            <Textarea
              id="complaint-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              required
            />
            {analysis && <ModerationFeedback analysis={analysis} />}
          </div>

          <p className="text-xs text-muted-foreground">
            Your browser and device info will be captured automatically for reference.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Complaint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
