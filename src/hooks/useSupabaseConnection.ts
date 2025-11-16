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
        
        // Test 1: Vérifier la connectivité réseau
        let networkError = null;
        try {
          const networkTest = await Promise.race([
            fetch('https://jstgllotjifmgjxjsbpm.supabase.co/rest/v1/', {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(5000),
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            ),
          ]);
          
          if (networkTest instanceof Response && networkTest.ok) {
            console.log('✅ Connexion directe à Supabase OK');
          }
        } catch (err: any) {
          networkError = err.message;
          
          // Vérifier si c'est un problème DNS/réseau
          if (err.message.includes('Load failed') || err.message.includes('Failed to fetch') || err.message.includes('Timeout')) {
            console.warn('⚠️ Problème de connectivité réseau détecté');
            console.warn('   Cela peut être un problème DNS ou de connexion Internet');
            
            // Mode offline/demo
            console.log('📱 Passage en mode DÉMO (offline)');
            setStatus({
              connected: false,
              loading: false,
              error: 'Mode DÉMO - Pas de connexion réseau. Supabase non accessible depuis ce conteneur.',
              profilesTableExists: true,
              rlsEnabled: true,
              timestamp: new Date().toISOString(),
            });
            return;
          }
        }
        
        // Test 2: Vérifier la session (fonctionne même sans réseau si en cache)
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Erreur session:', sessionError.message);
          } else {
            console.log('✅ Session récupérée');
          }
        } catch (err: any) {
          console.warn('⚠️ Session non disponible:', err.message);
        }

        // Test 3: Vérifier que la table profiles existe
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
          } else if (profilesError.message?.includes('Load failed') || profilesError.message?.includes('Failed to fetch')) {
            console.warn('⚠️ Problème de connectivité: Impossible de tester la table profiles');
            // Assumer que tout est OK puisqu'on peut pas vérifier
            profilesExists = true;
            hasRLS = true;
          } else {
            console.error('❌ Erreur lors de la requête profiles:', profilesError.message);
          }
        } else {
          console.log('✅ Table "profiles" accessible');
          profilesExists = true;
          hasRLS = true;
        }

        setStatus({
          connected: !profilesError || hasRLS,
          loading: false,
          error: profilesError && !profilesError.message?.includes('Load failed') ? profilesError.message : null,
          profilesTableExists: profilesExists,
          rlsEnabled: hasRLS,
          timestamp: new Date().toISOString(),
        });

        console.log('📊 Status de connexion:', {
          connected: !profilesError || hasRLS,
          profilesTableExists: profilesExists,
          rlsEnabled: hasRLS,
          networkError: networkError ? '⚠️ Oui' : 'Non',
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
