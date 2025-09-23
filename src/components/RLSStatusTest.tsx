import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const RLSStatusTest = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRLSStatus = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      console.log('🔍 Test de lecture de la table profiles...');
      
      // Test simple de lecture
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      const result = {
        success: !error,
        error: error?.message || null,
        dataCount: data?.length || 0,
        hasData: data && data.length > 0,
        isRLSBlocking: error?.message?.includes('infinite recursion') || error?.message?.includes('RLS'),
        timestamp: new Date().toLocaleTimeString()
      };

      setTestResult(result);
      console.log('📊 Résultat du test:', result);

    } catch (error: any) {
      const result = {
        success: false,
        error: error.message,
        dataCount: 0,
        hasData: false,
        isRLSBlocking: true,
        timestamp: new Date().toLocaleTimeString()
      };
      setTestResult(result);
      console.error('❌ Erreur lors du test:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!testResult) return 'gray';
    if (testResult.success && !testResult.isRLSBlocking) return 'green';
    if (testResult.isRLSBlocking) return 'red';
    return 'yellow';
  };

  const getStatusIcon = () => {
    if (!testResult) return <Database className="h-5 w-5" />;
    if (testResult.success && !testResult.isRLSBlocking) return <CheckCircle className="h-5 w-5" />;
    if (testResult.isRLSBlocking) return <XCircle className="h-5 w-5" />;
    return <AlertTriangle className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (!testResult) return 'Non testé';
    if (testResult.success && !testResult.isRLSBlocking) return 'RLS OK - Lecture autorisée';
    if (testResult.isRLSBlocking) return 'RLS BLOQUÉ - Récursion infinie détectée';
    return 'Problème de connexion';
  };

  return (
    <Card className={`border-${getStatusColor()}-200 bg-${getStatusColor()}-50`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-${getStatusColor()}-800`}>
          {getStatusIcon()}
          Test RLS Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge variant={testResult?.success ? 'default' : 'destructive'}>
            {getStatusText()}
          </Badge>
          {testResult && (
            <Badge variant="outline">
              {testResult.dataCount} profil{testResult.dataCount > 1 ? 's' : ''} trouvé{testResult.dataCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {testResult && (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Test effectué à :</strong> {testResult.timestamp}
            </div>
            
            {testResult.error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200">
                <div className="font-semibold mb-1">Erreur :</div>
                <div className="text-sm">{testResult.error}</div>
              </div>
            )}

            {testResult.isRLSBlocking && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg border border-red-200">
                <div className="font-semibold mb-2">🚨 RLS BLOQUÉ - Action requise :</div>
                <div className="text-sm space-y-1">
                  <p>1. Allez sur https://supabase.com/dashboard</p>
                  <p>2. Sélectionnez votre projet</p>
                  <p>3. Database → Tables → profiles</p>
                  <p>4. Onglet RLS → Désactivez "Enable Row Level Security"</p>
                  <p>5. Cliquez sur "Save"</p>
                </div>
              </div>
            )}

            {testResult.success && !testResult.isRLSBlocking && (
              <div className="p-3 bg-green-100 text-green-800 rounded-lg border border-green-200">
                <div className="font-semibold mb-1">✅ RLS OK !</div>
                <div className="text-sm">
                  La table profiles est accessible. Vous pouvez maintenant migrer vos données.
                </div>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={testRLSStatus}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Test en cours...' : 'Tester RLS'}
        </Button>

        <div className="text-xs text-gray-500">
          <p><strong>Ce test vérifie :</strong></p>
          <p>• Si la table profiles est accessible</p>
          <p>• Si RLS bloque la lecture</p>
          <p>• S'il y a des données existantes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RLSStatusTest;






