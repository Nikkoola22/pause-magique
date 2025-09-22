import { supabase } from '@/integrations/supabase/client';

export const testSupabaseConnection = async () => {
  console.log('🔍 Test de connexion à Supabase...');
  
  try {
    // Test de connexion basique
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erreur de connexion:', error);
      return false;
    }

    console.log('✅ Connexion à Supabase réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error);
    return false;
  }
};

export const checkSupabaseData = async () => {
  console.log('📊 Vérification des données dans Supabase...');
  
  try {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return;
    }

    console.log(`📈 Nombre de profils dans Supabase: ${count || 0}`);
    
    if (data && data.length > 0) {
      console.log('👥 Profils trouvés:');
      data.forEach(profile => {
        console.log(`  - ${profile.full_name} (${profile.role}) - ${profile.service}`);
      });
    } else {
      console.log('📭 Aucun profil trouvé dans Supabase');
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des données:', error);
  }
};

export const runSupabaseTests = async () => {
  console.log('🧪 Lancement des tests Supabase...');
  
  const isConnected = await testSupabaseConnection();
  if (!isConnected) {
    console.log('❌ Impossible de continuer les tests - connexion échouée');
    return;
  }

  await checkSupabaseData();
  console.log('✅ Tests Supabase terminés');
};




