import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut } from "lucide-react";

const WorkingAdminDashboard = () => {
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = sessionStorage.getItem('user_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData.role === 'admin') {
          setUserSession(userData);
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    window.location.href = '/';
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  if (!userSession) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                👑 Tableau de bord Administrateur
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Connecté en tant que <strong>{userSession.name || userSession.username}</strong>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👥</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                  <p className="text-2xl font-semibold text-gray-900">15</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👨‍💼</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Responsables</p>
                  <p className="text-2xl font-semibold text-gray-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👤</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Agents</p>
                  <p className="text-2xl font-semibold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🏢</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Services</p>
                  <p className="text-2xl font-semibold text-gray-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Dr. Jean Dupont</p>
                    <p className="text-sm text-gray-600">Responsable - Médecine</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Responsable</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Sophie Bernard</p>
                    <p className="text-sm text-gray-600">Agent - Médecine</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Agent</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">Pierre Durand</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Agent</Badge>
                </div>
              </div>
              
              <div className="mt-4">
                <Button className="w-full">+ Créer un utilisateur</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestion des Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded">
                  <h3 className="font-semibold">Médecine</h3>
                  <p className="text-sm text-gray-600">Service de médecine générale et spécialisée</p>
                  <p className="text-xs text-gray-500 mt-1">5 agents, 1 responsable</p>
                </div>
                
              </div>
              
              <div className="mt-4">
                <Button className="w-full">+ Créer un service</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Demande de congé approuvée</p>
                    <p className="text-xs text-gray-500">Sophie Bernard - Il y a 2 heures</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Nouvelle demande de congé</p>
                    <p className="text-xs text-gray-500">Pierre Durand - Il y a 4 heures</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Nouvel utilisateur créé</p>
                    <p className="text-xs text-gray-500">Claire Moreau - Il y a 1 jour</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkingAdminDashboard;
