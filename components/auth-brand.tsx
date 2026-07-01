'use client';

import Image from 'next/image';

export function AuthBrand() {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Image
          src="/brand-logo.png"
          alt="Bengkel Raka logo"
          width={64}
          height={64}
          className="h-full w-full object-contain"
        />
      </div>
      <h1 className="text-3xl font-bold text-foreground">BENGKEL RAKA</h1>
      <p className="mt-2 text-foreground/60">Smart Queue — Solusi antrian service bengkel modern</p>
    </div>
  );
}
