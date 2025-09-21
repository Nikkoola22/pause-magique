import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
  id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  status: 'en_attente' | 'approuve' | 'refuse';
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  active_requests: number;
}

const ManagerDashboard = () => {
  const { toast } = useToast();
  const [userSession, setUserSession] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const session = sessionStorage.getItem('user_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData.role === 'chef_service') {
          setUserSession(userData);
          loadLeaveRequests();
          loadTeamMembers();
        } else {
          console.log('User role not authorized:', userData.role);
          sessionStorage.removeItem('user_session');
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        sessionStorage.removeItem('user_session');
      }
    } else {
      console.log('No session found');
    }
  }, []);

  const loadLeaveRequests = () => {
    console.log('🔄 Chargement des demandes de congés depuis les dashboards agents...');
    
    // Nettoyer localStorage des données mock/anciennes
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    // Filtrer pour garder uniquement les vraies demandes des agents
    const realRequests = allRequests.filter(req => {
      // Garder toutes les demandes qui ont un nom d'employé
      const hasEmployeeName = req.employee_name && req.employee_name.trim() !== '';
      
      // Garder les demandes qui ne sont pas des exemples/démos
      const isNotExample = !req.reason?.toLowerCase().includes('exemple') && 
                          !req.reason?.toLowerCase().includes('demonstration') &&
                          !req.reason?.toLowerCase().includes('demo') &&
                          !req.reason?.toLowerCase().includes('test');
      
      // Garder les demandes récentes (après 2024-01-01 pour être plus permissif)
      const isRecent = new Date(req.created_at) > new Date('2024-01-01');
      
      console.log(`Demande ${req.employee_name}: hasEmployeeName=${hasEmployeeName}, isNotExample=${isNotExample}, isRecent=${isRecent}`);
      
      return hasEmployeeName && isNotExample && isRecent;
    });
    
    console.log('💾 Demandes filtrées (vraies demandes agents):', realRequests.length);
    
    // Afficher toutes les demandes pour débogage
    if (realRequests.length > 0) {
      console.log('📋 Détail des vraies demandes:');
      realRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.employee_name} - ${req.leave_type} - ${req.status} (${req.created_at})`);
      });
    } else {
      console.log('📝 Aucune vraie demande trouvée - les agents n\'ont pas encore créé de demandes');
    }
    
    // Trier par date de création (plus récent en premier)
    const sortedRequests = realRequests.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log('📋 Demandes chargées et triées:', sortedRequests.length);
    console.log('📋 Demandes en attente:', sortedRequests.filter(req => req.status === 'en_attente').length);
    setLeaveRequests(sortedRequests);
  };

  const loadTeamMembers = () => {
    // Pas de données mock - équipe vide par défaut
    // Les membres d'équipe seront chargés depuis Supabase si nécessaire
    setTeamMembers([]);
    console.log('📝 Équipe vide - aucune donnée mock chargée');
  };

  const handleApproveRequest = (requestId: string) => {
    console.log('✅ Approuver la demande:', requestId);
    setLeaveRequests(prev => {
      const updated = prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approuve' as const }
          : req
      );
      console.log('📋 Demandes mises à jour après approbation:', updated);
      
      // Mettre à jour localStorage
      localStorage.setItem('all_leave_requests', JSON.stringify(updated));
      console.log('💾 localStorage mis à jour après approbation');
      
      return updated;
    });
    
    toast({
      title: "Demande approuvée",
      description: "La demande de congé a été approuvée.",
    });
  };

  const handleRejectRequest = (requestId: string) => {
    console.log('❌ Refuser la demande:', requestId);
    setLeaveRequests(prev => {
      const updated = prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'refuse' as const }
          : req
      );
      console.log('📋 Demandes mises à jour après refus:', updated);
      
      // Mettre à jour localStorage
      localStorage.setItem('all_leave_requests', JSON.stringify(updated));
      console.log('💾 localStorage mis à jour après refus');
      
      return updated;
    });
    
    toast({
      title: "Demande refusée",
      description: "La demande de congé a été refusée.",
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    window.location.href = '/';
  };

  if (!userSession) {
    console.log('No user session, redirecting to login');
    return <Navigate to="/" replace />;
  }

  console.log('ManagerDashboard rendering with session:', userSession);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approuve':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'refuse':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = leaveRequests.filter(req => req.status === 'en_attente');
  const approvedRequests = leaveRequests.filter(req => req.status === 'approuve');
  const rejectedRequests = leaveRequests.filter(req => req.status === 'refuse');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bouton d'actualisation fixe */}
      <button 
        onClick={loadLeaveRequests}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'block',
          visibility: 'visible',
          opacity: '1'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
      >
        🔄 ACTUALISER
      </button>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Tableau de bord Responsable
              </h1>
              <Badge variant="outline" className="ml-4 bg-blue-100 text-blue-800">
                {userSession.service || 'Service'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Connecté en tant que <strong>{userSession.name || userSession.username}</strong>
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadLeaveRequests}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-semibold"
              >
                🔄 Actualiser les demandes
              </Button>
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
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approuvées</p>
                  <p className="text-2xl font-semibold text-gray-900">{approvedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Refusées</p>
                  <p className="text-2xl font-semibold text-gray-900">{rejectedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Équipe</p>
                  <p className="text-2xl font-semibold text-gray-900">{teamMembers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bouton d'actualisation principal */}
        <div className="flex justify-center mb-6">
          <button 
            onClick={loadLeaveRequests}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'block',
              visibility: 'visible',
              opacity: '1'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            🔄 Actualiser toutes les demandes
          </button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Demandes en attente ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Toutes les demandes
            </TabsTrigger>
            <TabsTrigger value="team">
              Mon équipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    Demandes nécessitant votre attention
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadLeaveRequests}
                    className="ml-4"
                  >
                    🔄 Actualiser
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune demande en attente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <Card key={request.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="font-semibold">{request.employee_name}</h3>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Type:</span> {request.leave_type}
                                </div>
                                <div>
                                  <span className="font-medium">Du:</span> {new Date(request.start_date).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                  <span className="font-medium">Au:</span> {new Date(request.end_date).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                  <span className="font-medium">Durée:</span> {request.days_count} jour(s)
                                </div>
                              </div>
                              {request.reason && (
                                <div className="mt-2">
                                  <span className="font-medium text-sm">Motif:</span>
                                  <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                                </div>
                              )}
                            </div>
                            {request.status === 'en_attente' && (
                              <div className="flex gap-2 ml-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approuver
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Refuser
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Toutes les demandes
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadLeaveRequests}
                    className="ml-4"
                  >
                    🔄 Actualiser
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {console.log('🎯 Rendu des demandes:', leaveRequests.length, 'demandes')}
                  {leaveRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold">{request.employee_name}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Type:</span> {request.leave_type}
                              </div>
                              <div>
                                <span className="font-medium">Du:</span> {new Date(request.start_date).toLocaleDateString('fr-FR')}
                              </div>
                              <div>
                                <span className="font-medium">Au:</span> {new Date(request.end_date).toLocaleDateString('fr-FR')}
                              </div>
                              <div>
                                <span className="font-medium">Durée:</span> {request.days_count} jour(s)
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mon équipe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.position}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Demandes actives:</span>
                            <Badge variant={member.active_requests > 0 ? "default" : "secondary"}>
                              {member.active_requests}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagerDashboard;
