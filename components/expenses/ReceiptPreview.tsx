'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ReceiptPreviewProps {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getFileType(url: string): 'image' | 'pdf' | 'csv' | 'other' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'csv') return 'csv';
  return 'other';
}

export function ReceiptPreview({ imageUrl, open, onOpenChange }: ReceiptPreviewProps) {
  if (!imageUrl) return null;

  const fileType = getFileType(imageUrl);
  const fileName = imageUrl.split('/').pop()?.split('?')[0] ?? 'receipt';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>

        {fileType === 'image' && (
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Receipt"
              className="max-h-[70vh] w-auto object-contain"
              loading="lazy"
            />
          </div>
        )}

        {fileType === 'pdf' && (
          <div className="rounded-lg overflow-hidden border bg-muted" style={{ height: '70vh' }}>
            <iframe
              src={imageUrl}
              title="Receipt PDF"
              className="h-full w-full"
            />
          </div>
        )}

        {(fileType === 'csv' || fileType === 'other') && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted py-16">
            <p className="text-sm text-muted-foreground">
              This file type cannot be previewed in the browser.
            </p>
            <Button asChild>
              <a href={imageUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download {fileType.toUpperCase()}
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
