import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useSupabaseConnection from '@/hooks/useSupabaseConnection';
import { SUPABASE_CONFIG, SUPABASE_SETUP_INSTRUCTIONS, getSupabaseStatus } from '@/utils/supabaseSetup';

interface StatusInfo {
  connected: boolean;
  online: boolean;
  statusCode: number;
  error?: string;
}

export const SupabaseInitPage = () => {
  const connectionStatus = useSupabaseConnection();
  const [supabaseStatus, setSupabaseStatus] = useState<StatusInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    const status = await getSupabaseStatus();
    setSupabaseStatus({
      connected: connectionStatus.connected,
      online: status.online,
      statusCode: status.status,
      error: status.error,
    });
    setIsChecking(false);
  };

  useEffect(() => {
    checkStatus();
  }, [connectionStatus]);

  const allGood = connectionStatus.connected && supabaseStatus?.online;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">🔧 Configuration Supabase</h1>
          <p className="text-slate-600">Vérification et initialisation de la connexion à la base de données</p>
        </div>

        {/* Status principal */}
        <div className="mb-6">
          {allGood ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-900 text-lg">Connexion établie ✅</AlertTitle>
              <AlertDescription className="text-green-800 mt-2">
                Supabase est connecté et fonctionnel. Vous pouvez accéder à l'application.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-900 text-lg">Connexion non établie ❌</AlertTitle>
              <AlertDescription className="text-red-800 mt-2">
                {connectionStatus.error || 'Vérifiez les étapes de configuration ci-dessous'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Informations détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Client */}
          <Alert className={connectionStatus.connected ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}>
            <AlertTitle className={connectionStatus.connected ? 'text-blue-900' : 'text-yellow-900'}>
              {connectionStatus.connected ? '✅' : '⚠️'} Client Supabase
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm space-y-1">
              <div>Statut: <strong>{connectionStatus.connected ? 'Connecté' : 'Déconnecté'}</strong></div>
              <div>Table profiles: <strong>{connectionStatus.profilesTableExists ? '✅ Existe' : '❌ Absent'}</strong></div>
              <div>RLS: <strong>{connectionStatus.rlsEnabled ? '✅ Activé' : '❌ Désactivé'}</strong></div>
              {connectionStatus.error && (
                <div className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded">
                  Erreur: {connectionStatus.error}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Serveur */}
          <Alert className={supabaseStatus?.online ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}>
            <AlertTitle className={supabaseStatus?.online ? 'text-blue-900' : 'text-yellow-900'}>
              {supabaseStatus?.online ? '✅' : '⚠️'} Serveur Supabase
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm space-y-1">
              <div>Statut: <strong>{supabaseStatus?.online ? 'Accessible' : 'Inaccessible'}</strong></div>
              <div>Code HTTP: <strong>{supabaseStatus?.statusCode || 'N/A'}</strong></div>
              <div>Project: <strong>{SUPABASE_CONFIG.PROJECT_ID}</strong></div>
              {supabaseStatus?.error && (
                <div className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded">
                  Erreur: {supabaseStatus.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>

        {/* Étapes de configuration */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">📋 Étapes de configuration</h2>
          <div className="space-y-4">
            {Object.values(SUPABASE_SETUP_INSTRUCTIONS).map((section: any, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-2">{section.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{section.description}</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                  {section.steps.map((step: string, stepIdx: number) => (
                    <li key={stepIdx}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={checkStatus}
            disabled={isChecking}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            Vérifier à nouveau
          </Button>
          <a
            href={SUPABASE_CONFIG.DASHBOARD}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ouvrir le Dashboard Supabase
            </Button>
          </a>
        </div>

        {/* Instructions supplémentaires */}
        <Alert className="bg-slate-100 border-slate-300">
          <AlertTitle className="text-slate-900">💡 Conseil important</AlertTitle>
          <AlertDescription className="text-slate-700 mt-2">
            <strong>Pour pousser les migrations automatiquement:</strong>
            <div className="bg-slate-800 text-slate-100 p-3 rounded mt-2 font-mono text-sm">
              <div># 1. Se connecter à Supabase CLI</div>
              <div>supabase login</div>
              <div className="mt-2"># 2. Pousser les migrations</div>
              <div>supabase db push</div>
              <div className="mt-2"># 3. Redémarrer le serveur</div>
              <div>npm run dev</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Bouton pour accéder à l'app */}
        {allGood && (
          <div className="mt-8 text-center">
            <a href="/">
              <Button className="px-8 py-2 text-lg gap-2">
                <CheckCircle className="h-5 w-5" />
                Accéder à l'application
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseInitPage;
