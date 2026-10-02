'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Application Error Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-[var(--ink)] text-[var(--ivory)] px-4 py-20">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[var(--danger)]/15 border border-[var(--danger)]/30 flex items-center justify-center text-[var(--danger)] mx-auto shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[var(--danger)] block">
          Notice
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-light text-[var(--ivory)]">
          Chronometer Interruption
        </h1>

        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
          An unforeseen variance occurred while rendering your horological request. Our artisans have been alerted.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] text-xs uppercase tracking-[0.2em] font-semibold rounded-md transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recalibrate (Retry)</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--charcoal)] border border-[var(--sand)]/20 hover:border-[var(--gold)]/40 text-[var(--sand)] text-xs uppercase tracking-[0.2em] font-medium rounded-md transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Atelier Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
