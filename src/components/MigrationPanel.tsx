import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { migrateLocalDataToSupabase, clearSupabaseProfiles, forceMigrationComplete } from '@/utils/migrateToSupabase';
import { runSupabaseTests } from '@/utils/testSupabase';
import { testSupabaseWithRLS } from '@/utils/fixSupabaseRLS';
import { supabase } from '@/integrations/supabase/client';

const MigrationPanel = ({ onMigrationComplete }: { onMigrationComplete?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [profileCount, setProfileCount] = useState(0);

  // Fonction pour charger le nombre de profils existants
  const checkProfileCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Erreur lors du comptage:', error);
        return;
      }

      setProfileCount(count || 0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Charger le nombre de profils existants au montage
  React.useEffect(() => {
    checkProfileCount();
  }, [status]);

  const handleMigration = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      await migrateLocalDataToSupabase();
      setStatus('success');
      setMessage('Migration réussie ! Les données locales ont été ajoutées à Supabase.');
      
      // Rafraîchir le compteur et notifier le parent
      setTimeout(async () => {
        await checkProfileCount();
        onMigrationComplete?.();
      }, 1000);
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de la migration. Vérifiez la console pour plus de détails.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer TOUS les profils de Supabase ? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      await clearSupabaseProfiles();
      setStatus('success');
      setMessage('Tous les profils ont été supprimés de Supabase.');
      
      // Rafraîchir le compteur et notifier le parent
      setTimeout(async () => {
        await checkProfileCount();
        onMigrationComplete?.();
      }, 1000);
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de la suppression. Vérifiez la console pour plus de détails.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceMigration = async () => {
    if (!confirm('Migration forcée : Cela va supprimer TOUS les profils existants et insérer les 12 nouveaux utilisateurs. Continuer ?')) {
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      await forceMigrationComplete();
      setStatus('success');
      setMessage('Migration forcée réussie ! Tous les 12 utilisateurs ont été ajoutés à Supabase.');
      
      // Rafraîchir le compteur et notifier le parent
      setTimeout(async () => {
        await checkProfileCount();
        onMigrationComplete?.();
      }, 1000);
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de la migration forcée. Vérifiez la console pour plus de détails.');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      // Test RLS d'abord
      const rlsTest = await testSupabaseWithRLS();
      if (!rlsTest) {
        setStatus('error');
        setMessage('Problème RLS détecté. Vérifiez la console pour les détails.');
        return;
      }

      await runSupabaseTests();
      setStatus('success');
      setMessage('Tests Supabase terminés. Vérifiez la console pour les détails.');
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors des tests. Vérifiez la console pour plus de détails.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Database className="h-5 w-5" />
          Migration vers Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            {profileCount} profil{profileCount > 1 ? 's' : ''} dans Supabase
          </Badge>
          <Badge variant="outline" className="bg-green-100 text-green-700">
            12 utilisateurs locaux disponibles (8 agents + 3 responsables + 1 admin)
          </Badge>
        </div>

        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            status === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : status === 'error'
              ? 'bg-red-100 text-red-800 border border-red-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : status === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleTest}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {loading ? 'Test...' : 'Tester la connexion'}
          </Button>
          
          <Button 
            onClick={handleMigration}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Migration...' : 'Migrer les données locales'}
          </Button>

          <Button 
            onClick={handleForceMigration}
            disabled={loading}
            variant="secondary"
            className="flex items-center gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200"
          >
            <Upload className="h-4 w-4" />
            {loading ? 'Migration forcée...' : 'Migration forcée (12 utilisateurs)'}
          </Button>
          
          <Button 
            onClick={handleClear}
            disabled={loading || profileCount === 0}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Vider Supabase
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Test :</strong> Vérifie la connexion à Supabase et affiche les données</p>
          <p><strong>Migration :</strong> Ajoute les nouveaux utilisateurs (évite les doublons)</p>
          <p><strong>Migration forcée :</strong> Supprime tout et ajoute les 12 utilisateurs complets</p>
          <p><strong>Vider :</strong> Supprime tous les profils de Supabase (attention !)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MigrationPanel;
