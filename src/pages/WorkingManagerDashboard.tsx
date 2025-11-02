import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, CheckCircle, XCircle, Clock, Calendar, Users } from "lucide-react";
import WeeklySchedule from "@/components/WeeklySchedule";
import AgentProfile from "@/components/AgentProfile";
import MonthlyLeaveCalendar from "@/components/MonthlyLeaveCalendar";
import { applyLeaveToSchedule, ScheduleSlot } from "@/utils/leaveRequestUtils";

const WorkingManagerDashboard = () => {
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<{ [key: string]: ScheduleSlot[] }>({});

  // Données des agents du service (vide - utiliser Supabase uniquement)
  const serviceAgents = [];

  // Fonction pour charger les demandes depuis localStorage
  const loadLeaveRequests = () => {
    console.log('🔄 Chargement des demandes de congés depuis localStorage...');
    
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    console.log('📋 Demandes trouvées dans localStorage:', allRequests.length);
    
    // Filtrer pour garder uniquement les vraies demandes des agents
    const realRequests = allRequests.filter(req => {
      const hasEmployeeName = req.employee_name && req.employee_name.trim() !== '';
      // Filtre ultra-permissif - seulement exclure les demandes sans nom d'employé
      
      console.log(`Demande ${req.employee_name}: hasEmployeeName=${hasEmployeeName}`);
      console.log(`Motif: "${req.reason}" - Garde: ${hasEmployeeName}`);
      
      return hasEmployeeName;
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

  useEffect(() => {
    const session = sessionStorage.getItem('user_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData.role === 'chef_service') {
          setUserSession(userData);
          // Charger les demandes après avoir défini la session
          loadLeaveRequests();
          
          // Charger les plannings
          const saved = localStorage.getItem('weeklySchedules');
          if (saved) {
            try {
              setSchedules(JSON.parse(saved));
            } catch (error) {
              console.error('Erreur lors du chargement des plannings:', error);
            }
          }
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

  // Si un agent est sélectionné, afficher sa fiche
  if (selectedAgent) {
    return (
      <AgentProfile 
        agent={selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                👨‍💼 Tableau de bord Responsable
              </h1>
              <Badge variant="outline" className="ml-4 bg-blue-100 text-blue-800">
                {userSession.service || 'Service'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={loadLeaveRequests}
                variant="outline" 
                size="sm"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                🔄 Actualiser
              </Button>
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

        {/* Pending Requests */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Demandes nécessitant votre attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRequests.filter(req => req.status === 'en_attente').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune demande en attente</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les demandes créées par les agents apparaîtront ici automatiquement
                  </p>
                  <Button 
                    onClick={loadLeaveRequests}
                    className="mt-4"
                    variant="outline"
                  >
                    🔄 Actualiser
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests
                    .filter(req => req.status === 'en_attente')
                    .map((request) => (
                      <div key={request.id} className="border-l-4 border-l-yellow-500 p-4 bg-yellow-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold">{request.employee_name}</h3>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                En attente
                              </Badge>
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
                            <div className="mt-2 text-xs text-gray-500">
                              Créée le: {new Date(request.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                // Obtenir l'ID agent depuis agent_id (priorité) ou employee_name
                                let agentId = (request as any).agent_id || request.employee_name;
                                
                                // Trouver l'agent concerné
                                let agent = serviceAgents.find(a => a.id === agentId || a.name === request.employee_name);
                                
                                if (!agent) {
                                  // Créer un agent temporaire si non trouvé
                                  agent = {
                                    id: agentId,
                                    name: request.employee_name
                                  } as any;
                                }
                                
                                // Créer une version approuvée de la demande pour applyLeaveToSchedule
                                const approvedRequest = {
                                  ...request,
                                  status: 'approuve'
                                };
                                
                                setLeaveRequests(prev => prev.map(req => 
                                  req.id === request.id ? { ...req, status: 'approuve' } : req
                                ));
                                // Sauvegarder dans localStorage
                                const updatedRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
                                const updated = updatedRequests.map((req: any) => 
                                  req.id === request.id ? { ...req, status: 'approuve' } : req
                                );
                                localStorage.setItem('all_leave_requests', JSON.stringify(updated));
                                
                                // Appliquer le congé au planning avec la demande approuvée
                                if (agent && agent.id) {
                                  const currentSchedules = JSON.parse(localStorage.getItem('weeklySchedules') || '{}');
                                  const updatedSchedules = applyLeaveToSchedule(agent.id, approvedRequest, currentSchedules);
                                  setSchedules(updatedSchedules);
                                  console.log('📅 Congé appliqué au planning de:', agent.name);
                                }
                                
                                console.log('✅ Demande approuvée:', request.id);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approuver
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setLeaveRequests(prev => prev.map(req => 
                                  req.id === request.id ? { ...req, status: 'refuse' } : req
                                ));
                                // Sauvegarder dans localStorage
                                const updatedRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
                                const updated = updatedRequests.map((req: any) => 
                                  req.id === request.id ? { ...req, status: 'refuse' } : req
                                );
                                localStorage.setItem('all_leave_requests', JSON.stringify(updated));
                                console.log('❌ Demande refusée:', request.id);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="text-center pt-4">
                    <Button 
                      onClick={loadLeaveRequests}
                      variant="outline"
                      size="sm"
                    >
                      🔄 Actualiser les demandes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Mon équipe - Deux colonnes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mon équipe
              <span className="text-sm text-gray-500 font-normal">(cliquez sur un nom pour voir la fiche)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceAgents.map((agent, index) => {
                const initials = agent.name.split(' ').map(n => n[0]).join('');
                const colors = [
                  'bg-blue-100 text-blue-600',
                  'bg-green-100 text-green-600', 
                  'bg-purple-100 text-purple-600',
                  'bg-orange-100 text-orange-600',
                  'bg-pink-100 text-pink-600',
                  'bg-indigo-100 text-indigo-600',
                  'bg-teal-100 text-teal-600',
                  'bg-red-100 text-red-600'
                ];
                
                return (
                  <div key={agent.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                    <div className={`w-10 h-10 ${colors[index % colors.length]} rounded-full flex items-center justify-center`}>
                      <span className="font-semibold">{initials}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-600 hover:text-blue-800">{agent.name}</h3>
                      <p className="text-sm text-gray-600">{agent.role}</p>
                    </div>
                    <Badge variant="secondary">
                      {leaveRequests.filter(req => req.employee_name === agent.name && req.status === 'en_attente').length} demande{leaveRequests.filter(req => req.employee_name === agent.name && req.status === 'en_attente').length > 1 ? 's' : ''} active{leaveRequests.filter(req => req.employee_name === agent.name && req.status === 'en_attente').length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Calendrier mensuel des congés */}
        <div className="mt-8">
          <MonthlyLeaveCalendar 
            agents={serviceAgents} 
            leaveRequests={leaveRequests} 
          />
        </div>

        {/* Section Planning Hebdomadaire */}
        <div className="mt-8">
          <WeeklySchedule agents={serviceAgents} />
        </div>
      </div>
    </div>
  );
};

export default WorkingManagerDashboard;
