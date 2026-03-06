'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mess_anon_id';

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Hook to get a persistent anonymous identity for moderation tracking.
 * Stored in localStorage so it survives page reloads.
 */
export function useAnonId(): string {
  const [anonId, setAnonId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setAnonId(id);
  }, []);

  return anonId;
}

/** Non-hook version for use in service functions */
export function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
