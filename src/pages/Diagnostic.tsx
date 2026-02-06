import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AssetCheck {
  url: string;
  label: string;
  status: 'pending' | 'ok' | 'error';
  contentType?: string;
  statusCode?: number;
  error?: string;
}

export default function Diagnostic() {
  const [checks, setChecks] = useState<AssetCheck[]>([]);
  const [running, setRunning] = useState(false);

  const assetsToTest: { url: string; label: string }[] = [
    { url: '/assets/app.js', label: 'Entrypoint principal (app.js)' },
    { url: '/manifest.json', label: 'PWA Manifest' },
    { url: '/favicon.png', label: 'Favicon' },
  ];

  const runDiagnostic = async () => {
    setRunning(true);
    const results: AssetCheck[] = assetsToTest.map((a) => ({
      ...a,
      status: 'pending',
    }));
    setChecks([...results]);

    for (let i = 0; i < results.length; i++) {
      const asset = results[i];
      try {
        const res = await fetch(asset.url, { cache: 'no-store' });
        const contentType = res.headers.get('content-type') || 'unknown';
        
        // Check if JS asset returns HTML (broken)
        const isJsAsset = asset.url.endsWith('.js');
        const returnsHtml = contentType.includes('text/html');
        
        results[i] = {
          ...asset,
          status: isJsAsset && returnsHtml ? 'error' : 'ok',
          contentType,
          statusCode: res.status,
          error: isJsAsset && returnsHtml ? 'Reçoit HTML au lieu de JS' : undefined,
        };
      } catch (e) {
        results[i] = {
          ...asset,
          status: 'error',
          error: e instanceof Error ? e.message : 'Erreur réseau',
        };
      }
      setChecks([...results]);
    }
    setRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const allOk = checks.length > 0 && checks.every((c) => c.status === 'ok');
  const hasError = checks.some((c) => c.status === 'error');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Diagnostic Preview</h1>
          <p className="text-muted-foreground">
            Vérifie si les assets sont correctement servis par l'environnement.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tests des assets</CardTitle>
                <CardDescription>
                  Hostname: <code className="text-xs bg-muted px-1 py-0.5 rounded">{window.location.hostname}</code>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnostic}
                disabled={running}
              >
                {running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Relancer</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="mt-0.5">
                  {check.status === 'pending' && (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  )}
                  {check.status === 'ok' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {check.status === 'error' && (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-medium text-sm">{check.label}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {check.url}
                  </div>
                  {check.contentType && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Content-Type:</span>{' '}
                      <code className={`px-1 py-0.5 rounded ${
                        check.error ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                      }`}>
                        {check.contentType}
                      </code>
                    </div>
                  )}
                  {check.statusCode && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <code className="bg-muted px-1 py-0.5 rounded">{check.statusCode}</code>
                    </div>
                  )}
                  {check.error && (
                    <div className="text-xs text-destructive font-medium">
                      ⚠️ {check.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        {!running && checks.length > 0 && (
          <Card className={hasError ? 'border-destructive/50' : 'border-green-500/50'}>
            <CardContent className="pt-6">
              {allOk ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="font-medium text-green-600">
                    Tous les assets sont correctement servis !
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <XCircle className="h-8 w-8 text-destructive mx-auto" />
                    <p className="font-medium text-destructive">
                      Preview cassée : les assets JS sont réécrits en HTML
                    </p>
                    <p className="text-sm text-muted-foreground">
                      C'est un problème d'infrastructure preview. L'application fonctionne
                      correctement sur l'URL Published.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button asChild>
                      <a
                        href="https://djassa-marketplace.lovable.app"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ouvrir la version Published
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Si vous voyez cette page, c'est que React a pu démarrer (au moins partiellement).
          </p>
        </div>
      </div>
    </div>
  );
}
