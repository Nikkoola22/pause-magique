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
        <div className="font-semibold">❌ Supabase non connecté</div>
        <div className="text-sm mt-1">
          {status.error?.includes('--local') 
            ? status.error 
            : 'Connexion impossible. Démarrez avec: ./scripts/start-with-supabase.sh --local'}
        </div>
        {showDetails && (
          <div className="text-xs mt-2 space-y-2 bg-red-100 rounded p-2">
            <div className="font-semibold">🔧 Solution rapide:</div>
            <div>Lancez le Mock Server local:</div>
            <div className="bg-red-900 text-red-100 p-1 rounded font-mono text-xs mt-1">
              ./scripts/start-with-supabase.sh --local
            </div>
            <div className="mt-2">Puis ouvrez: http://localhost:5173</div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default SupabaseConnectionStatus;
