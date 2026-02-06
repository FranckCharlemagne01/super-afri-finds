import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

/**
 * Detects if we're running in a broken preview environment
 * (assets being rewritten to HTML instead of served as JS).
 * If so, shows a dismissible banner with a link to the published URL.
 */
export function PreviewBrokenBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only run check in preview-like environments
    const isPreview = window.location.hostname.includes('preview--') ||
                      window.location.hostname.includes('-preview--');
    
    if (!isPreview) return;

    // Check if /assets/app.js returns HTML instead of JS
    const controller = new AbortController();
    fetch('/assets/app.js', { 
      method: 'HEAD', 
      signal: controller.signal,
      cache: 'no-store'
    })
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        // If it returns HTML instead of JS, preview is broken
        if (contentType.includes('text/html')) {
          setShow(true);
        }
      })
      .catch(() => {
        // Network error or aborted - don't show banner
      });

    return () => controller.abort();
  }, []);

  if (!show || dismissed) return null;

  const publishedUrl = 'https://djassa-marketplace.lovable.app';

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between gap-3 text-sm shadow-lg">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          Preview cassée (assets non servis).
        </span>
        <a
          href={publishedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline whitespace-nowrap"
        >
          Ouvrir Published
          <ExternalLink className="h-3 w-3" />
        </a>
        <span className="opacity-60">|</span>
        <a
          href="/diagnostic"
          className="font-medium underline underline-offset-2 hover:no-underline whitespace-nowrap"
        >
          Diagnostic
        </a>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-background/20 rounded transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
