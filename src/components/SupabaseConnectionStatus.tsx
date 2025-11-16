import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import useSupabaseConnection from '@/hooks/useSupabaseConnection';

interface SupabaseStatusProps {
  showDetails?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const SupabaseConnectionStatus = ({
  showDetails = false,
  autoHide = true,
  autoHideDelay = 5000,
}: SupabaseStatusProps) => {
  const status = useSupabaseConnection();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status.connected && autoHide) {
      const timer = setTimeout(() => setVisible(false), autoHideDelay);
      return () => clearTimeout(timer);
    }
    setVisible(true);
  }, [status.connected, autoHide, autoHideDelay]);

  if (!visible && status.connected) {
    return null;
  }

  if (status.loading) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Loader className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800">
          Vérification de la connexion Supabase en cours...
        </AlertDescription>
      </Alert>
    );
  }

  // Mode démo/offline
  if (status.error?.includes('Mode DÉMO')) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="font-semibold">⚠️ Mode DÉMO (hors ligne)</div>
          <div className="text-sm mt-1">Pas de connexion réseau vers Supabase. L'application fonctionne en mode démo.</div>
          {showDetails && (
            <div className="text-xs mt-2 p-2 bg-yellow-100 rounded">
              <strong>Configuration requise:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Vérifier la connectivité Internet</li>
                <li>Vérifier les paramètres DNS</li>
                <li>Vérifier les pare-feu/proxy</li>
                <li>Une fois connecté: Ajouter http://localhost:5173 aux CORS Supabase</li>
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (status.connected) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ Connexion Supabase établie avec succès
          {showDetails && (
            <div className="text-xs mt-2 space-y-1 opacity-75">
              <div>Table profiles: {status.profilesTableExists ? '✅' : '❌'}</div>
              <div>RLS activé: {status.rlsEnabled ? '✅' : '❌'}</div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-red-50 border-red-200">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="font-semibold">❌ Erreur de connexion Supabase</div>
        <div className="text-sm mt-1">{status.error}</div>
        {showDetails && (
          <div className="text-xs mt-2 space-y-1 opacity-75">
            <div>Table profiles: {status.profilesTableExists ? '✅' : '❌'}</div>
            <div>RLS activé: {status.rlsEnabled ? '✅' : '❌'}</div>
            <div className="mt-2 p-2 bg-red-100 rounded text-xs">
              <strong>Actions à faire:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Vérifier les CORS dans Supabase Dashboard</li>
                <li>Vérifier que la table "profiles" existe</li>
                <li>Vérifier les RLS policies</li>
                <li>Redémarrer le serveur: npm run dev</li>
              </ul>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default SupabaseConnectionStatus;
