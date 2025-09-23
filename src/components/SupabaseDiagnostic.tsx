import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SupabaseDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const results: any = {
      connection: false,
      profilesCount: 0,
      profiles: [],
      error: null
    };

    try {
      // Test de connexion
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (error) {
        results.error = error.message;
        console.error('Erreur Supabase:', error);
      } else {
        results.connection = true;
        results.profilesCount = count || 0;
        results.profiles = data || [];
      }
    } catch (error: any) {
      results.error = error.message;
      console.error('Erreur de connexion:', error);
    }

    setDiagnostics(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  if (!diagnostics) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Database className="h-5 w-5" />
            Diagnostic Supabase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-yellow-600" />
            <p>Chargement du diagnostic...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-${diagnostics.connection ? 'green' : 'red'}-200 bg-${diagnostics.connection ? 'green' : 'red'}-50`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-${diagnostics.connection ? 'green' : 'red'}-800`}>
          {diagnostics.connection ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          Diagnostic Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant={diagnostics.connection ? 'default' : 'destructive'}>
            {diagnostics.connection ? 'Connexion OK' : 'Connexion ÉCHOUÉE'}
          </Badge>
          <Badge variant="outline">
            {diagnostics.profilesCount} profil{diagnostics.profilesCount > 1 ? 's' : ''} trouvé{diagnostics.profilesCount > 1 ? 's' : ''}
          </Badge>
        </div>

        {diagnostics.error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Erreur :</strong>
            </div>
            <p className="text-sm">{diagnostics.error}</p>
          </div>
        )}

        {diagnostics.connection && diagnostics.profiles.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Profils trouvés :</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {diagnostics.profiles.map((profile: any) => (
                <div key={profile.id} className="p-2 bg-white rounded border text-sm">
                  <div className="flex items-center gap-2">
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
                  <div className="text-gray-500 text-xs mt-1">
                    {profile.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {diagnostics.connection && diagnostics.profilesCount === 0 && (
          <div className="text-center py-4">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Aucun profil trouvé dans Supabase</p>
            <p className="text-sm text-gray-500">Utilisez le panneau de migration pour ajouter des utilisateurs</p>
          </div>
        )}

        <Button 
          onClick={runDiagnostic}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Diagnostic...' : 'Relancer le diagnostic'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SupabaseDiagnostic;






