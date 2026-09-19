"use client";

import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav className="container-main flex h-14 items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2 transition-base hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Rakt<span className="text-crimson">Setu</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          <Link href="/privacy" className="text-sm text-muted transition-base hover:text-foreground">
            Privacy
          </Link>
          <Link href="/demo" className="text-sm text-muted transition-base hover:text-foreground">
            Demo
          </Link>
          <Link
            href="/join"
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-base hover:bg-surface-hover"
          >
            Become a Donor
          </Link>
          <Link
            href="/request/new"
            className="inline-flex h-9 items-center rounded-lg bg-crimson px-4 text-sm font-medium text-white transition-base hover:opacity-90"
          >
            Need Blood
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/privacy" onClick={() => setMenuOpen(false)} className="text-sm text-muted py-2">
              Privacy Model
            </Link>
            <Link href="/demo" onClick={() => setMenuOpen(false)} className="text-sm text-muted py-2">
              Demo
            </Link>
            <Link
              href="/join"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium"
            >
              Become a Donor
            </Link>
            <Link
              href="/request/new"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-crimson text-sm font-medium text-white"
            >
              Need Blood
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
