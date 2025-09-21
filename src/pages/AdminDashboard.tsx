import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Users, 
  UserCheck, 
  Clock,
  TrendingUp,
  Settings,
  BarChart3
} from "lucide-react";
import UserManagementSupabase from "@/components/UserManagementSupabase";
import MigrationPanel from "@/components/MigrationPanel";
import DeepDiagnostic from "@/components/DeepDiagnostic";

const AdminDashboard = () => {
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'agents' | 'managers' | 'services'>('dashboard');
  
  // État pour les statistiques dynamiques
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalManagers: 0,
    averageHours: 0,
    totalServices: 0
  });

  // État pour les données dynamiques
  const [agentsData, setAgentsData] = useState<any[]>([]);
  const [managersData, setManagersData] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);

  useEffect(() => {
    const session = sessionStorage.getItem('user_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData.role === 'admin') {
          setUserSession(userData);
          loadDashboardData();
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
    setLoading(false);
  }, []);

  // Fonction pour charger les données détaillées
  const loadDetailedData = async () => {
    try {
      console.log('🔄 Chargement des données détaillées...');
      
      const response = await fetch('https://jstgllotjifmgjxjsbpm.supabase.co/rest/v1/profiles?select=*', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdGdsbG90amlmbWdqeGpzYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzA0NDIsImV4cCI6MjA3MzQ0NjQ0Mn0.g-Zllg8NqrqNg-do5v2TCakK4RXUb6KAyvhS_yEiks4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdGdsbG90amlmbWdqeGpzYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzA0NDIsImV4cCI6MjA3MzQ0NjQ0Mn0.g-Zllg8NqrqNg-do5v2TCakK4RXUb6KAyvhS_yEiks4'
        }
      });

      if (response.ok) {
        const users = await response.json();
        
        // Filtrer les agents
        const agents = users.filter(user => 
          user.role === 'employe' || 
          user.role === 'medecin' || 
          user.role === 'infirmiere' ||
          user.role === 'dentiste' ||
          user.role === 'assistante_dentaire' ||
          user.role === 'rh' ||
          user.role === 'comptabilite' ||
          user.role === 'sage_femme'
        );
        
        // Filtrer les managers
        const managers = users.filter(user => user.role === 'chef_service');
        
        // Calculer les services
        const services = [...new Set(users.map(user => user.service).filter(Boolean))].map(service => {
          const serviceUsers = users.filter(user => user.service === service);
          const serviceAgents = serviceUsers.filter(user => 
            user.role === 'employe' || 
            user.role === 'medecin' || 
            user.role === 'infirmiere' ||
            user.role === 'dentiste' ||
            user.role === 'assistante_dentaire' ||
            user.role === 'rh' ||
            user.role === 'comptabilite' ||
            user.role === 'sage_femme'
          );
          const serviceManagers = serviceUsers.filter(user => user.role === 'chef_service');
          
          return {
            name: service,
            agents: serviceAgents.length,
            managers: serviceManagers.length,
            description: `Service ${service.toLowerCase()}`
          };
        });

        setAgentsData(agents);
        setManagersData(managers);
        setServicesData(services);

        console.log('✅ Données détaillées chargées:', {
          agents: agents.length,
          managers: managers.length,
          services: services.length
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données détaillées:', error);
    }
  };

  // Fonction pour charger les données du dashboard
  const loadDashboardData = async () => {
    try {
      console.log('🔄 Chargement des données du dashboard admin...');
      
      // Charger les utilisateurs depuis Supabase
      const response = await fetch('https://jstgllotjifmgjxjsbpm.supabase.co/rest/v1/profiles?select=*', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdGdsbG90amlmbWdqeGpzYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzA0NDIsImV4cCI6MjA3MzQ0NjQ0Mn0.g-Zllg8NqrqNg-do5v2TCakK4RXUb6KAyvhS_yEiks4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdGdsbG90amlmbWdqeGpzYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzA0NDIsImV4cCI6MjA3MzQ0NjQ0Mn0.g-Zllg8NqrqNg-do5v2TCakK4RXUb6KAyvhS_yEiks4'
        }
      });

      if (response.ok) {
        const users = await response.json();
        console.log('📋 Utilisateurs chargés:', users.length);
        
        // Calculer les statistiques
        const totalUsers = users.length;
        const totalAgents = users.filter(user => user.role === 'employe' || user.role === 'medecin' || user.role === 'infirmiere').length;
        const totalManagers = users.filter(user => user.role === 'chef_service').length;
        const totalServices = [...new Set(users.map(user => user.service).filter(Boolean))].length;
        
        // Calculer la moyenne des heures (si disponible)
        const usersWithHours = users.filter(user => user.weekly_hours);
        const averageHours = usersWithHours.length > 0 
          ? usersWithHours.reduce((sum, user) => sum + (user.weekly_hours || 0), 0) / usersWithHours.length
          : 0;

        setGlobalStats({
          totalUsers,
          totalAgents,
          totalManagers,
          averageHours: Math.round(averageHours * 10) / 10,
          totalServices
        });

        console.log('✅ Statistiques mises à jour:', {
          totalUsers,
          totalAgents,
          totalManagers,
          averageHours: Math.round(averageHours * 10) / 10,
          totalServices
        });

        // Charger aussi les données détaillées
        await loadDetailedData();
      } else {
        console.error('❌ Erreur lors du chargement des utilisateurs:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
    }
  };

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

  // Fonction pour rendre les cartes cliquables
  const renderClickableCard = (title: string, value: string | number, icon: React.ReactNode, color: string, onClick: () => void) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${color}`}>
            {icon}
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-gray-600">{title}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Vues détaillées
  if (currentView === 'agents') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4"
                >
                  ← Retour
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  👥 Liste des Agents ({agentsData.length})
                </h1>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentsData.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">
                        {agent.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-gray-600">{agent.role}</p>
                      <p className="text-xs text-blue-600">{agent.service}</p>
                      <p className="text-xs text-gray-500">{agent.weeklyHours}h/semaine</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'managers') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4"
                >
                  ← Retour
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  👔 Liste des Responsables ({managersData.length})
                </h1>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managersData.map((manager) => (
              <Card key={manager.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600">
                        {manager.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{manager.name}</h3>
                      <p className="text-sm text-gray-600">{manager.role}</p>
                      <p className="text-xs text-green-600">{manager.service}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'services') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4"
                >
                  ← Retour
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  🏥 Liste des Services ({servicesData.length})
                </h1>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {servicesData.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{service.agents}</div>
                      <div className="text-sm text-gray-600">Agents</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{service.managers}</div>
                      <div className="text-sm text-gray-600">Responsables</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Si on est en mode gestion des utilisateurs
  if (currentView === 'users') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('dashboard')}
                  className="mr-4"
                >
                  ← Retour
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">
                  🛠️ Gestion des Utilisateurs
                </h1>
              </div>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <DeepDiagnostic />
            <MigrationPanel onMigrationComplete={() => {
              // Forcer le rechargement de la page pour rafraîchir UserManagementSupabase
              window.location.reload();
            }} />
            <UserManagementSupabase />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🛠️ Tableau de bord Administrateur
              </h1>
              <Badge variant="outline" className="ml-4 bg-red-100 text-red-800">
                {userSession.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={loadDashboardData} 
                className="flex items-center gap-2"
                title="Actualiser les données"
              >
                <TrendingUp className="h-4 w-4" />
                Actualiser
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <div className="flex gap-4">
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Tableau de bord
            </Button>
            <Button 
              variant={currentView === 'users' ? 'default' : 'outline'}
              onClick={() => setCurrentView('users')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Gestion des utilisateurs
            </Button>
          </div>
        </div>

        {/* Statistiques globales - Cartes cliquables */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {renderClickableCard(
            "Total utilisateurs",
            globalStats.totalUsers,
            <Users className="h-6 w-6 text-blue-600" />,
            "bg-blue-100",
            () => setCurrentView('users')
          )}
          
          {renderClickableCard(
            "Agents",
            globalStats.totalAgents,
            <UserCheck className="h-6 w-6 text-green-600" />,
            "bg-green-100",
            () => setCurrentView('agents')
          )}
          
          {renderClickableCard(
            "Responsables",
            globalStats.totalManagers,
            <UserCheck className="h-6 w-6 text-blue-600" />,
            "bg-blue-100",
            () => setCurrentView('managers')
          )}
          
          {renderClickableCard(
            "Moyenne heures",
            `${globalStats.averageHours}h`,
            <Clock className="h-6 w-6 text-orange-600" />,
            "bg-orange-100",
            () => {
              // Afficher un modal avec les détails des heures
              alert(`Moyenne des heures hebdomadaires: ${globalStats.averageHours}h\n\nRépartition:\n- 35h: 4 agents\n- 36h: 2 agents\n- 38h: 2 agents`);
            }
          )}
          
          {renderClickableCard(
            "Services",
            globalStats.totalServices,
            <Settings className="h-6 w-6 text-gray-600" />,
            "bg-gray-100",
            () => setCurrentView('services')
          )}
        </div>


        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => setCurrentView('users')}
                className="flex items-center gap-2 h-16"
              >
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Gestion des utilisateurs</div>
                  <div className="text-sm opacity-90">Créer et modifier les fiches</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="flex items-center gap-2 h-16"
              >
                <Settings className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Configuration</div>
                  <div className="text-sm opacity-90">Paramètres système</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;