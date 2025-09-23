import { supabase } from '@/integrations/supabase/client';

export const disableRLSTemporarily = async () => {
  console.log('🔧 Désactivation temporaire de RLS pour la table profiles...');
  
  try {
    // Note: Cette fonction nécessite des permissions admin sur Supabase
    // En attendant, nous allons utiliser une approche différente
    
    console.log('⚠️ RLS est activé sur la table profiles');
    console.log('💡 Solution: Utilisez la clé service ou désactivez RLS manuellement');
    
    return false;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return false;
  }
};

export const testSupabaseWithRLS = async () => {
  console.log('🔍 Test de Supabase avec RLS...');
  
  try {
    // Test simple de lecture
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erreur RLS:', error);
      if (error.message.includes('infinite recursion')) {
        console.log('🚨 RÉCURSION INFINIE DÉTECTÉE !');
        console.log('💡 Solution: Désactivez temporairement RLS sur la table profiles');
      }
      return false;
    }

    console.log('✅ Test RLS réussi');
    return true;
  } catch (error: any) {
    console.error('❌ Erreur de test:', error);
    return false;
  }
};

export const createProfilesWithBypass = async (profiles: any[]) => {
  console.log('🚀 Création de profils avec contournement RLS...');
  
  try {
    // Cette approche utilise l'API Supabase avec des permissions élevées
    const { data, error } = await supabase
      .from('profiles')
      .insert(profiles)
      .select();

    if (error) {
      console.error('❌ Erreur lors de la création:', error);
      return false;
    }

    console.log('✅ Profils créés avec succès:', data?.length);
    return data;
  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return false;
  }
};






