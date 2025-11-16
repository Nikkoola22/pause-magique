/**
 * Configuration et aide pour Supabase
 * Fournit des instructions sur comment corriger les problèmes de connexion
 */

export const SUPABASE_CONFIG = {
  PROJECT_ID: 'jstgllotjifmgjxjsbpm',
  URL: 'https://jstgllotjifmgjxjsbpm.supabase.co',
  DASHBOARD: 'https://app.supabase.com/project/jstgllotjifmgjxjsbpm',
};

export const SUPABASE_SETUP_INSTRUCTIONS = {
  CORS: {
    title: '1. Configurer les CORS',
    description: 'Autoriser votre domaine à accéder à Supabase',
    steps: [
      `1. Allez à: ${SUPABASE_CONFIG.DASHBOARD}`,
      '2. Cliquez sur "Settings" (engrenage)',
      '3. Sélectionnez "API"',
      '4. Sous "CORS", ajoutez:',
      '   - http://localhost:5173 (développement)',
      '   - http://localhost:8081 (dev alternatif)',
      '   - http://localhost:3000 (si applicable)',
      '   - votre-domaine-production.com (production)',
      '5. Cliquez "Save"',
    ],
  },
  PROFILES_TABLE: {
    title: '2. Créer la table "profiles"',
    description: 'Créer la table profiles avec RLS',
    steps: [
      `1. Allez à: ${SUPABASE_CONFIG.DASHBOARD}`,
      '2. Cliquez sur "SQL Editor"',
      '3. Cliquez sur "New Query"',
      '4. Collez le SQL fourni (voir fichier migrations)',
      '5. Cliquez "Run"',
    ],
  },
  RLS: {
    title: '3. Vérifier les RLS Policies',
    description: 'S\'assurer que les politiques de sécurité sont correctes',
    steps: [
      `1. Allez à: ${SUPABASE_CONFIG.DASHBOARD}`,
      '2. Cliquez sur "Authentication"',
      '3. Sélectionnez "Policies"',
      '4. Vérifiez que "profiles" table a RLS activé',
      '5. Vérifiez les policies SELECT, INSERT, UPDATE',
    ],
  },
  PUSH_MIGRATIONS: {
    title: '4. Pousser les migrations',
    description: 'Appliquer les migrations à Supabase',
    steps: [
      'Ouvrez un terminal',
      'Assurez-vous d\'être connecté: supabase login',
      'Exécutez: supabase db push',
      'Attendez que les migrations soient appliquées',
    ],
  },
};

export const printSupabaseSetupInstructions = () => {
  console.log('🔧 Configuration Supabase requise:');
  console.log('=====================================\n');

  Object.values(SUPABASE_SETUP_INSTRUCTIONS).forEach((section: any) => {
    console.log(`\n${section.title}`);
    console.log('─'.repeat(50));
    console.log(`Description: ${section.description}`);
    console.log('\nÉtapes:');
    section.steps.forEach((step: string) => {
      console.log(`  ${step}`);
    });
  });

  console.log('\n\n✅ Une fois ces étapes complétées:');
  console.log('  1. Redémarrez le serveur: npm run dev');
  console.log('  2. Rafraîchissez la page: F5');
  console.log('  3. Vérifiez la console du navigateur pour les erreurs');
  console.log('  4. Testez la connexion via DevTools > Console');
};

export const getSupabaseStatus = async () => {
  try {
    const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      online: response.ok,
      status: response.status,
      url: SUPABASE_CONFIG.URL,
    };
  } catch (error: any) {
    return {
      online: false,
      status: 0,
      error: error.message,
      url: SUPABASE_CONFIG.URL,
    };
  }
};

export default {
  SUPABASE_CONFIG,
  SUPABASE_SETUP_INSTRUCTIONS,
  printSupabaseSetupInstructions,
  getSupabaseStatus,
};
