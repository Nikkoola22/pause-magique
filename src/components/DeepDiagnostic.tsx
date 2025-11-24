import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const DeepDiagnostic = () => {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDeepDiagnostic = async () => {
    setLoading(true);
    setDiagnostic(null);

    try {
      console.log('🔍 Diagnostic approfondi de Supabase...');
      
      // 1. Test de connexion basique
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (connectionError) {
        setDiagnostic({
          connection: false,
          error: connectionError.message,
          step: 'connexion'
        });
        return;
      }

      // 2. Compter tous les profils
      const { count: totalCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        setDiagnostic({
          connection: true,
          error: countError.message,
          step: 'comptage'
        });
        return;
      }

      // 3. Récupérer tous les profils avec détails
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) {
        setDiagnostic({
          connection: true,
          count: totalCount,
          error: profilesError.message,
          step: 'récupération'
        });
        return;
      }

      // 4. Analyser les données
      const analysis = {
        connection: true,
        totalCount: totalCount || 0,
        profilesRetrieved: allProfiles?.length || 0,
        profiles: allProfiles || [],
        step: 'analyse',
        details: {
          byRole: {},
          byService: {},
          uniqueIds: new Set(),
          duplicateIds: []
        }
      };

      // Analyser les profils
      if (allProfiles) {
        allProfiles.forEach(profile => {
          // Par rôle
          analysis.details.byRole[profile.role] = (analysis.details.byRole[profile.role] || 0) + 1;
          
          // Par service
          const service = profile.service || 'null';
          analysis.details.byService[service] = (analysis.details.byService[service] || 0) + 1;
          
          // Vérifier les doublons d'ID
          if (analysis.details.uniqueIds.has(profile.id)) {
            analysis.details.duplicateIds.push(profile.id);
          } else {
            analysis.details.uniqueIds.add(profile.id);
          }
        });
      }

      setDiagnostic(analysis);
      console.log('📊 Diagnostic complet:', analysis);

    } catch (error: any) {
      // GESTION DU MODE HORS LIGNE (FALLBACK)
      if (error.message === 'Failed to fetch' || error.message === 'Load failed' || error.name === 'TypeError') {
        console.log('⚠️ Mode hors ligne détecté (Supabase inaccessible)');
        
        // Comptes de test codés en dur dans NewLoginPage.tsx
        const localProfiles = [
          { id: '00000000-0000-0000-0000-000000000000', full_name: 'Admin Système', role: 'admin', service: 'Administration' },
          { id: '11111111-1111-1111-1111-111111111111', full_name: 'Responsable Médecine', role: 'chef_service', service: 'Médecine' },
          { id: '22222222-2222-2222-2222-222222222222', full_name: 'Agent Un', role: 'employe', service: 'Médecine' },
          { id: '33333333-3333-3333-3333-333333333333', full_name: 'Nat Danede', role: 'employe', service: 'Médecine' }
        ];

        const analysis = {
          connection: false,
          isOffline: true,
          totalCount: localProfiles.length,
          profilesRetrieved: localProfiles.length,
          profiles: localProfiles,
          step: 'analyse_locale',
          details: {
            byRole: { 'admin': 1, 'chef_service': 1, 'employe': 2 },
            byService: { 'Administration': 1, 'Médecine': 3 },
            uniqueIds: new Set(localProfiles.map(p => p.id)),
            duplicateIds: []
          },
          error: "Supabase inaccessible - Mode Local Activé"
        };
        
        setDiagnostic(analysis);
        return;
      }

      setDiagnostic({
        connection: false,
        error: error.message,
        step: 'erreur'
      });
      console.error('❌ Erreur lors du diagnostic:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!diagnostic) return 'gray';
    if (diagnostic.isOffline) return 'orange'; // Couleur pour le mode hors ligne
    if (diagnostic.error) return 'red';
    if (diagnostic.totalCount === 12) return 'green';
    if (diagnostic.totalCount > 0) return 'yellow';
    return 'red';
  };

  const getStatusIcon = () => {
    if (!diagnostic) return <Search className="h-5 w-5" />;
    if (diagnostic.isOffline) return <Database className="h-5 w-5" />; // Icône pour le mode hors ligne
    if (diagnostic.error) return <AlertTriangle className="h-5 w-5" />;
    if (diagnostic.totalCount === 12) return <CheckCircle className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  return (
    <Card className={`border-${getStatusColor()}-200 bg-${getStatusColor()}-50`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-${getStatusColor()}-800`}>
          {getStatusIcon()}
          Diagnostic Approfondi Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant={diagnostic?.connection ? 'default' : (diagnostic?.isOffline ? 'secondary' : 'destructive')}>
            {diagnostic?.connection ? 'Connexion OK' : (diagnostic?.isOffline ? 'Mode Local (Hors Ligne)' : 'Connexion ÉCHOUÉE')}
          </Badge>
          <Badge variant="outline">
            {diagnostic?.totalCount || 0} profil{diagnostic?.totalCount !== 1 ? 's' : ''} total
          </Badge>
          <Badge variant="outline">
            {diagnostic?.profilesRetrieved || 0} récupéré{diagnostic?.profilesRetrieved !== 1 ? 's' : ''}
          </Badge>
        </div>

        {diagnostic?.error && !diagnostic?.isOffline && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200">
            <div className="font-semibold mb-1">❌ Erreur à l'étape "{diagnostic.step}":</div>
            <div className="text-sm">{diagnostic.error}</div>
          </div>
        )}

        {diagnostic?.isOffline && (
          <div className="p-3 bg-orange-100 text-orange-800 rounded-lg border border-orange-200">
            <div className="font-semibold mb-1">⚠️ Mode Hors Ligne Activé</div>
            <div className="text-sm">
              La connexion à Supabase a échoué. L'application utilise les données locales et les comptes de test pour fonctionner.
              <br/>
              <strong>Comptes disponibles :</strong> Admin, Responsable Médecine, Agent 1, Agent 3.
            </div>
          </div>
        )}

        {(diagnostic?.connection || diagnostic?.isOffline) && (
          <div className="space-y-3">
            {/* Résumé */}
            <div className="p-3 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
              <div className="font-semibold mb-2">📊 Résumé des données :</div>
              <div className="text-sm space-y-1">
                <p>• Total dans Supabase : {diagnostic.totalCount} profils</p>
                <p>• Récupérés par l'API : {diagnostic.profilesRetrieved} profils</p>
                <p>• IDs uniques : {diagnostic.details.uniqueIds.size}</p>
                {diagnostic.details.duplicateIds.length > 0 && (
                  <p>• ⚠️ Doublons détectés : {diagnostic.details.duplicateIds.join(', ')}</p>
                )}
              </div>
            </div>

            {/* Par rôle */}
            <div className="p-3 bg-green-100 text-green-800 rounded-lg border border-green-200">
              <div className="font-semibold mb-2">👥 Répartition par rôle :</div>
              <div className="text-sm space-y-1">
                {Object.entries(diagnostic.details.byRole).map(([role, count]) => (
                  <p key={role}>• {role} : {count as number} profil{(count as number) > 1 ? 's' : ''}</p>
                ))}
              </div>
            </div>

            {/* Par service */}
            <div className="p-3 bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
              <div className="font-semibold mb-2">🏥 Répartition par service :</div>
              <div className="text-sm space-y-1">
                {Object.entries(diagnostic.details.byService).map(([service, count]) => (
                  <p key={service}>• {service || 'null'} : {count as number} profil{(count as number) > 1 ? 's' : ''}</p>
                ))}
              </div>
            </div>

            {/* Liste détaillée */}
            {diagnostic.profiles.length > 0 && (
              <div className="p-3 bg-gray-100 text-gray-800 rounded-lg border border-gray-200">
                <div className="font-semibold mb-2">📋 Liste détaillée :</div>
                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {diagnostic.profiles.map((profile: any, index: number) => (
                    <div key={profile.id} className="flex items-center gap-2">
                      <span className="w-6 text-center">{index + 1}.</span>
                      <span className="font-medium">{profile.full_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {profile.role}
                      </Badge>
                      {profile.service && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {profile.service}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations */}
            <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
              <div className="font-semibold mb-2">💡 Recommandations :</div>
              <div className="text-sm space-y-1">
                {diagnostic.totalCount === 0 && (
                  <p>• Aucune donnée trouvée → Utilisez "Migration forcée"</p>
                )}
                {diagnostic.totalCount > 0 && diagnostic.totalCount < 12 && (
                  <p>• Données partielles → Utilisez "Migration forcée" pour compléter</p>
                )}
                {diagnostic.totalCount === 12 && (
                  <p>• ✅ Données complètes → Cliquez sur "Recharger" dans Gestion des Utilisateurs</p>
                )}
                {diagnostic.details.duplicateIds.length > 0 && (
                  <p>• ⚠️ Doublons détectés → Utilisez "Vider Supabase" puis "Migration forcée"</p>
                )}
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={runDeepDiagnostic}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <Search className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Diagnostic en cours...' : '🔍 Diagnostic Approfondi'}
        </Button>

        <div className="text-xs text-gray-500">
          <p><strong>Ce diagnostic vérifie :</strong></p>
          <p>• Connexion à Supabase</p>
          <p>• Nombre total de profils</p>
          <p>• Répartition par rôle et service</p>
          <p>• Détection des doublons</p>
          <p>• Recommandations d'action</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeepDiagnostic;






