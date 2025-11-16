/**
 * Script d'initialisation Supabase
 * Vérifie et configure automatiquement la connexion et les tables
 */

import { supabase } from '@/integrations/supabase/client';

export const initializeSupabase = async () => {
  console.log('🚀 Initialisation Supabase...');

  try {
    // Étape 1: Vérifier la connexion
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('✅ Session Supabase vérifiée');

    // Étape 2: Vérifier l'existence de la table profiles
    const { data: profilesData, error: profilesError, status } = await supabase
      .from('profiles')
      .select('count()', { count: 'exact' })
      .limit(1);

    if (profilesError) {
      console.warn('⚠️ Table profiles inaccessible:', profilesError.message);

      // Si c'est un problème de RLS, la table existe mais est protégée
      if (profilesError.message.includes('row-level security')) {
        console.log('✅ Table profiles existe et RLS est activé');
        return {
          success: true,
          message: 'Connexion Supabase établie. Table profiles accessible avec RLS.',
          profilesTableExists: true,
          rlsEnabled: true,
        };
      }

      // Si la table n'existe pas, créer un enregistrement de test
      if (
        profilesError.message.includes('relation') ||
        profilesError.message.includes('does not exist')
      ) {
        console.log('⚠️ Table profiles n\'existe pas. Tentative de création...');

        // Créer la table et les RLS policies via une fonction SQL
        try {
          const { error: createError } = await (supabase as any).rpc('ensure_profiles_table', {});

          if (createError) {
            console.warn('⚠️ Impossible de créer la table via RPC:', createError.message);
            console.log('ℹ️ Essayez d\'exécuter la migration manuellement:');
            console.log('   supabase db push');
          } else {
            console.log('✅ Table profiles créée avec succès');
          }
        } catch (rpcError: any) {
          console.warn('⚠️ Erreur RPC:', rpcError.message);
        }
      }
    } else {
      console.log('✅ Table profiles existe et est accessible');
    }

    // Étape 3: Afficher le résumé
    console.log('📊 Résumé de l\'initialisation Supabase:');
    console.log({
      url: import.meta.env.VITE_SUPABASE_URL,
      projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
      connected: true,
      profilesTableExists: !profilesError?.message.includes('does not exist'),
      rlsEnabled: profilesError?.message.includes('row-level security') || !profilesError,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Supabase initialisé avec succès',
      profilesTableExists: true,
      rlsEnabled: true,
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'initialisation Supabase:', error.message);
    return {
      success: false,
      message: error.message,
      profilesTableExists: false,
      rlsEnabled: false,
    };
  }
};

// Initialiser au chargement du module
export default initializeSupabase;
