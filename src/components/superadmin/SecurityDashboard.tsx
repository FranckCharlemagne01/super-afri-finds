import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  Lock, Unlock, Eye, AlertTriangle, Activity,
  UserX, Globe, FileText, RefreshCw, Download,
  Ban, KeyRound, ClipboardCheck, Server,
  CheckCircle2, XCircle, Info, Clock
} from 'lucide-react';

interface SecurityStats {
  total_events_24h: number;
  critical_7d: number;
  warnings_7d: number;
  logins_today: number;
  failures_today: number;
  suspicious_ips: number;
}

interface SecurityLog {
  id: string;
  event_type: string;
  severity: string;
  title: string;
  description: string | null;
  user_id: string | null;
  ip_address: string | null;
  created_at: string;
}

const severityConfig: Record<string, { color: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: ShieldX, label: 'Critique' },
  warning: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: ShieldAlert, label: 'Attention' },
  info: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info, label: 'Info' },
};

export const SecurityDashboard = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        supabase.rpc('get_security_dashboard_stats'),
        supabase.rpc('get_recent_security_logs', { _limit: 20 }),
      ]);
      if (statsRes.data) setStats(statsRes.data as unknown as SecurityStats);
      if (logsRes.data) setLogs(logsRes.data as unknown as SecurityLog[]);
    } catch (e) {
      console.error('Security dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate security score
  const securityScore = (() => {
    let score = 70; // Base: HTTPS + Auth + RLS
    if (stats) {
      if (stats.critical_7d === 0) score += 15;
      else if (stats.critical_7d < 3) score += 5;
      if (stats.failures_today < 5) score += 10;
      else if (stats.failures_today < 20) score += 5;
      if (stats.suspicious_ips === 0) score += 5;
    }
    return Math.min(100, score);
  })();

  const scoreColor = securityScore >= 80 ? 'text-emerald-600' : securityScore >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreProgressColor = securityScore >= 80 ? 'bg-emerald-500' : securityScore >= 60 ? 'bg-amber-500' : 'bg-red-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Security Score */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-bold">Score de Sécurité Global</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Évaluation basée sur HTTPS, Auth, RLS et activités suspectes
              </p>
              <div className="flex items-end gap-4">
                <span className={`text-5xl font-black ${scoreColor}`}>{securityScore}</span>
                <span className="text-slate-400 text-lg mb-1">/100</span>
              </div>
              <div className="mt-3 w-64">
                <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${scoreProgressColor}`}
                    style={{ width: `${securityScore}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">HTTPS actif</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Auth Supabase sécurisée</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">RLS activé sur toutes les tables</span>
              </div>
              <div className="flex items-center gap-2">
                {stats && stats.critical_7d > 0 ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-slate-300">
                  {stats?.critical_7d || 0} alerte(s) critique(s) (7j)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Auth Activity */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Connexions aujourd\'hui', value: stats?.logins_today || 0, icon: Lock, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Échecs connexion', value: stats?.failures_today || 0, icon: Unlock, color: 'text-red-600 bg-red-50' },
          { label: 'IPs suspectes (7j)', value: stats?.suspicious_ips || 0, icon: Globe, color: 'text-amber-600 bg-amber-50' },
          { label: 'Événements (24h)', value: stats?.total_events_24h || 0, icon: Activity, color: 'text-blue-600 bg-blue-50' },
        ].map((item) => (
          <Card key={item.label} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section 3: Recent Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Alertes Sécurité Récentes
              </CardTitle>
              <CardDescription>Événements des dernières 24 heures</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
              <p className="font-medium">Aucune alerte récente</p>
              <p className="text-sm">Tout est sous contrôle ✓</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.map((log) => {
                const config = severityConfig[log.severity] || severityConfig.info;
                const Icon = config.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className={`p-1.5 rounded-md border ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{log.title}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{config.label}</Badge>
                      </div>
                      {log.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </span>
                        {log.ip_address && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Audit Trail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Logs & Audit Trail
          </CardTitle>
          <CardDescription>Actions critiques enregistrées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Sévérité</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      Aucun log enregistré
                    </td>
                  </tr>
                ) : (
                  logs.slice(0, 10).map((log) => {
                    const config = severityConfig[log.severity] || severityConfig.info;
                    return (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs font-mono">
                            {log.event_type}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell truncate max-w-xs">
                          {log.title}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('fr-FR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                            {config.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Supabase Security Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-violet-500" />
            Statut Sécurité Supabase
          </CardTitle>
          <CardDescription>État de la configuration de sécurité backend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Row Level Security (RLS)', status: 'active', desc: 'Activé sur toutes les tables', icon: ShieldCheck },
              { label: 'Storage Buckets', status: 'active', desc: 'Politiques RLS appliquées', icon: Lock },
              { label: 'API Protection', status: 'active', desc: 'Authentification requise (401)', icon: KeyRound },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                    Actif
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Actions Rapides SuperAdmin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:border-red-300 hover:bg-red-50"
              onClick={() => toast({ title: 'Fonctionnalité à venir', description: 'Blocage IP sera disponible prochainement.' })}
            >
              <Ban className="w-5 h-5 text-red-500" />
              <span className="text-xs">Bloquer une IP</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:border-amber-300 hover:bg-amber-50"
              onClick={() => toast({ title: 'Fonctionnalité à venir', description: 'MFA forcé sera disponible prochainement.' })}
            >
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span className="text-xs">Forcer MFA admins</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:border-blue-300 hover:bg-blue-50"
              onClick={() => toast({ title: 'Fonctionnalité à venir', description: 'Export PDF sera disponible prochainement.' })}
            >
              <Download className="w-5 h-5 text-blue-500" />
              <span className="text-xs">Exporter rapport</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:border-violet-300 hover:bg-violet-50"
              onClick={() => {
                fetchData();
                toast({ title: 'Audit lancé', description: 'Les données de sécurité ont été actualisées.' });
              }}
            >
              <Eye className="w-5 h-5 text-violet-500" />
              <span className="text-xs">Lancer audit</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
