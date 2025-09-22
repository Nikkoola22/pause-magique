import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DebugDashboard = () => {
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('DebugDashboard useEffect triggered');
    try {
      const session = sessionStorage.getItem('user_session');
      console.log('Session from storage:', session);
      
      if (session) {
        const userData = JSON.parse(session);
        console.log('Parsed user data:', userData);
        setUserSession(userData);
      } else {
        console.log('No session found');
        setError('Aucune session trouvée');
      }
    } catch (err) {
      console.error('Error in DebugDashboard:', err);
      setError('Erreur lors du chargement de la session');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chargement...</h1>
          <p>Vérification de la session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleLogout}>Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  if (!userSession) {
    console.log('No user session, redirecting to login');
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🔧 Dashboard de Debug
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Connecté en tant que <strong>{userSession.name || userSession.username}</strong>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>✅ Dashboard fonctionne !</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Informations de session :</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(userSession, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Rôle détecté :</h3>
                <p className="text-lg font-bold text-blue-600">{userSession.role}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Redirection recommandée :</h3>
                <div className="space-y-2">
                  {userSession.role === 'admin' && (
                    <p className="text-green-600">→ Dashboard Admin (/admin-dashboard)</p>
                  )}
                  {userSession.role === 'chef_service' && (
                    <p className="text-blue-600">→ Dashboard Responsable (/manager-dashboard)</p>
                  )}
                  {userSession.role === 'employe' && (
                    <p className="text-purple-600">→ Dashboard Agent (/agent-dashboard)</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugDashboard;




