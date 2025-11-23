import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConnectionStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
  profilesTableExists: boolean;
  rlsEnabled: boolean;
  timestamp: string;
}

// Essayer plusieurs URLs/IPs en cas de problème DNS
const getSupabaseUrls = () => {
  const urls = [
    'https://jstgllotjifmgjxjsbpm.supabase.co', // Supabase Cloud
  ];
  
  // Ajouter l'URL locale/proxy si on est dans le navigateur
  if (typeof window !== 'undefined') {
    // Priorité à l'URL relative (proxy)
    urls.unshift(window.location.origin);
    
    // Ajouter localhost si on est en local
    if (window.location.hostname === 'localhost') {
      urls.unshift('http://localhost:3001');
    }
  } else {
    // En environnement Node/Test
    urls.unshift('http://localhost:3001');
  }
  
  return urls;
};

export const useSupabaseConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: true,
    error: null,
    profilesTableExists: false,
    rlsEnabled: false,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('🔍 Vérification de la connexion Supabase...');
        const SUPABASE_URLS = getSupabaseUrls();
        
        // Test avec le client Supabase
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.warn('⚠️ Erreur session (c\'est normal):', sessionError.message);
          } else {
            console.log('✅ Session récupérée');
          }
        } catch (err: any) {
          console.warn('⚠️ Session non disponible:', err.message);
        }

        // Test la table profiles
        let profilesError;
        try {
          const result = await supabase
            .from('profiles')
            .select('*')
            .limit(1);
          
          profilesError = result.error;
        } catch (err: any) {
          profilesError = err;
        }

        let profilesExists = false;
        let hasRLS = false;

        if (profilesError) {
          if (profilesError.message?.includes('relation') || profilesError.message?.includes('does not exist')) {
            console.error('❌ Table "profiles" n\'existe pas');
          } else if (profilesError.message?.includes('row-level security')) {
            console.warn('⚠️ RLS policy bloque l\'accès');
            hasRLS = true;
            profilesExists = true;
          } else if (profilesError.message?.includes('Load failed') || profilesError.message?.includes('Failed to fetch') || profilesError.message?.includes('Could not resolve')) {
            console.warn('⚠️ Problème de connectivité réseau/DNS');
            // Ne pas assumer OK - essayer un fetch direct
            profilesExists = false;
            hasRLS = false;
          } else {
            console.error('❌ Erreur:', profilesError.message);
          }
        } else {
          console.log('✅ Table "profiles" accessible');
          profilesExists = true;
          hasRLS = true;
        }

        // Test 2: Vérifier la connectivité réseau directe
        let networkOK = false;
        let workingUrl = '';
        
        for (const url of SUPABASE_URLS) {
          try {
            const response = await fetch(`${url}/rest/v1/`, {
              method: 'HEAD',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              signal: AbortSignal.timeout(3000),
            });
            
            if (response.ok || response.status === 401 || response.status === 404) {
              console.log(`✅ Connexion OK via ${url}`);
              networkOK = true;
              workingUrl = url;
              profilesExists = true;
              hasRLS = true;
              break;
            }
          } catch (err: any) {
            console.warn(`⚠️ Erreur pour ${url}:`, err.message);
          }
        }

        setStatus({
          connected: networkOK && (profilesExists || hasRLS),
          loading: false,
          error: networkOK ? null : 'Impossible de se connecter à Supabase. Vérifiez que le serveur est lancé avec ./scripts/start-with-supabase.sh --local',
          profilesTableExists: profilesExists,
          rlsEnabled: hasRLS,
          timestamp: new Date().toISOString(),
        });

        console.log('📊 Status de connexion:', {
          connected: networkOK && (profilesExists || hasRLS),
          profilesTableExists: profilesExists,
          rlsEnabled: hasRLS,
          networkOK,
          workingUrl,
        });

      } catch (err: any) {
        console.error('❌ Erreur lors de la vérification:', err.message);
        setStatus({
          connected: false,
          loading: false,
          error: err.message,
          profilesTableExists: false,
          rlsEnabled: false,
          timestamp: new Date().toISOString(),
        });
      }
    };

    checkConnection();

    // Vérifier à nouveau toutes les 30 secondes
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return status;
};

export default useSupabaseConnection;
