import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-subtle">
      <div className="container-main py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-crimson">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">Proximo.</span>
            </div>
            <p className="mt-2 text-xs text-muted max-w-sm leading-relaxed">
              District-level blood donor matching with privacy at its core. 
              No data is shared until a donor explicitly accepts a request.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/privacy" className="text-muted transition-base hover:text-foreground">
              Privacy Model
            </Link>
            <Link href="/demo" className="text-muted transition-base hover:text-foreground">
              Demo Panel
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
          Built for Ernakulam district, Kerala. Not a medical service — always contact your hospital blood bank directly.
        </div>
      </div>
    </footer>
  );
}
