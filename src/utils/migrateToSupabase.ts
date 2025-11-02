import { supabase } from '@/integrations/supabase/client';

// Données des utilisateurs (vide - utiliser Supabase uniquement)
const localAgents = [];

export const migrateLocalDataToSupabase = async () => {
  console.log('🚀 Début de la migration des données locales vers Supabase...');
  
  try {
    // Vérifier les données existantes
    const { data: existingData, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name');

    if (checkError) {
      console.error('Erreur lors de la vérification des données existantes:', checkError);
      return;
    }

    console.log(`📊 Données existantes: ${existingData?.length || 0} profils trouvés`);
    if (existingData && existingData.length > 0) {
      console.log('👥 Profils existants:', existingData.map(p => `${p.full_name} (${p.id})`));
    }

    // Préparer les données pour l'insertion
    const profilesToInsert = localAgents.map(agent => ({
      id: agent.id,
      full_name: agent.full_name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      service: agent.service,
      hire_date: null // Les dates textuelles ne sont pas supportées, on utilise null
    }));

    console.log(`📝 Tentative d'insertion de ${profilesToInsert.length} profils...`);

    // Utiliser l'API REST directement pour contourner RLS
    const response = await fetch(`${supabase.supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabase.supabaseKey,
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(profilesToInsert)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur lors de l\'insertion des profils:', response.status, errorText);
      return;
    }

    const insertedProfiles = await response.json();

    console.log('✅ Migration réussie !', insertedProfiles?.length, 'utilisateurs traités dans Supabase');
    
    // Afficher la liste des utilisateurs migrés
    console.log('👥 Utilisateurs traités:');
    insertedProfiles?.forEach(profile => {
      console.log(`  - ${profile.full_name} (${profile.role}) - ${profile.service}`);
    });

    return insertedProfiles;
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
};

// Fonction pour vider la table profiles (utile pour les tests)
export const clearSupabaseProfiles = async () => {
  try {
    // Vider la table profiles
    console.log('🗑️ Suppression des profils...');
    const profilesResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/profiles?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: {
        'apikey': supabase.supabaseKey,
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    if (!profilesResponse.ok) {
      const errorText = await profilesResponse.text();
      console.error('Erreur lors de la suppression des profils:', profilesResponse.status, errorText);
    } else {
      console.log('✅ Profils supprimés');
    }

    console.log('🗑️ Données supprimées de Supabase');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  }
};

// Fonction pour forcer la migration complète
export const forceMigrationComplete = async () => {
  console.log('🚀 Migration forcée - Remplacement de toutes les données...');
  
  try {
    // 1. Vider la table profiles
    console.log('🗑️ Suppression des données existantes...');
    await clearSupabaseProfiles();
    
    // 2. Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Insérer directement dans la table profiles (sans contrainte users)
    console.log('📝 Insertion directe dans la table profiles...');
    const profilesToInsert = localAgents.map(agent => ({
      id: agent.id,
      full_name: agent.full_name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      service: agent.service,
      hire_date: null // Les dates textuelles ne sont pas supportées, on utilise null
    }));

    console.log(`📝 Tentative d'insertion de ${profilesToInsert.length} profils...`);

    const profilesResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': supabase.supabaseKey,
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(profilesToInsert)
    });

    if (!profilesResponse.ok) {
      const errorText = await profilesResponse.text();
      console.error('Erreur lors de l\'insertion des profils:', profilesResponse.status, errorText);
      throw new Error(`Erreur profiles ${profilesResponse.status}: ${errorText}`);
    }

    const insertedProfiles = await profilesResponse.json();

    console.log('✅ Migration forcée réussie !', insertedProfiles?.length, 'utilisateurs ajoutés à Supabase');
    
    // Afficher la liste des utilisateurs migrés
    console.log('👥 Utilisateurs ajoutés:');
    insertedProfiles?.forEach(profile => {
      console.log(`  - ${profile.full_name} (${profile.role}) - ${profile.service}`);
    });

    return insertedProfiles;
  } catch (error) {
    console.error('❌ Erreur lors de la migration forcée:', error);
    throw error;
  }
};
