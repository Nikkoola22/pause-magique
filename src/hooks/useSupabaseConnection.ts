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
        
        // Test 1: Vérifier la connexion simple
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Erreur session:', sessionError.message);
        } else {
          console.log('✅ Session récupérée');
        }

        // Test 2: Vérifier que la table profiles existe
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);

        let profilesExists = false;
        let hasRLS = false;

        if (profilesError) {
          if (profilesError.message.includes('relation') || profilesError.message.includes('does not exist')) {
            console.error('❌ Table "profiles" n\'existe pas');
          } else if (profilesError.message.includes('row-level security')) {
            console.warn('⚠️ RLS policy bloque l\'accès');
            hasRLS = true;
            profilesExists = true;
          } else {
            console.error('❌ Erreur lors de la requête profiles:', profilesError.message);
          }
        } else {
          console.log('✅ Table "profiles" accessible');
          profilesExists = true;
          hasRLS = true;
        }

        // Test 3: Vérifier la connexion avec un fetch direct
        try {
          const response = await fetch('https://jstgllotjifmgjxjsbpm.supabase.co/rest/v1/', {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            console.log('✅ Connexion directe à Supabase OK');
          } else {
            console.warn(`⚠️ Réponse Supabase: ${response.status}`);
          }
        } catch (fetchError: any) {
          console.error('❌ Erreur de connexion directe:', fetchError.message);
        }

        setStatus({
          connected: !profilesError || hasRLS,
          loading: false,
          error: profilesError ? profilesError.message : null,
          profilesTableExists: profilesExists,
          rlsEnabled: hasRLS,
          timestamp: new Date().toISOString(),
        });

        console.log('📊 Status de connexion:', {
          connected: !profilesError || hasRLS,
          profilesTableExists: profilesExists,
          rlsEnabled: hasRLS,
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
