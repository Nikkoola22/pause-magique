import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Calendar, Plus, CheckCircle, XCircle, Clock, BarChart3, Gift, Award } from "lucide-react";
import ReadOnlySchedule from "@/components/ReadOnlySchedule";
import CalendarPicker from "@/components/CalendarPicker";
import AgentScheduleSection from "@/components/AgentScheduleSection";

const WorkingAgentDashboard = () => {
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  // Variable mockRequests supprimée - utilisation directe de getAgentRequests

  // Fonction pour récupérer les demandes de l'agent depuis localStorage
  const getAgentRequests = (userSessionData?: any) => {
    if (!userSessionData) return [];
    
    // Charger depuis all_leave_requests (source unique de vérité)
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    // Filtrer les demandes de cet agent
    const agentRequests = allRequests.filter(req => {
      const isAgentRequest = req.employee_name === userSessionData.name || 
                            req.employee_name === userSessionData.username ||
                            req.employee_name === 'Sophie Bernard';
      
      return isAgentRequest;
    });
    
    // Trier par date de création (plus récent en premier)
    agentRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return agentRequests;
  };

  useEffect(() => {
    const session = sessionStorage.getItem('user_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        // Accepter tous les rôles d'agents (employe, medecin, infirmiere, etc.)
        const agentRoles = ['employe', 'medecin', 'infirmiere', 'dentiste', 'assistante_dentaire', 'rh', 'comptabilite', 'sage_femme'];
        if (agentRoles.includes(userData.role)) {
          setUserSession(userData);
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
    
    setLoading(false);
  }, []);

  // Fonction supprimée - utilisation directe de getAgentRequests

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    window.location.href = '/';
  };

  // Fonction pour calculer les RTT en heures selon les heures hebdomadaires
  const calculateRTT = (weeklyHours: number): number => {
    if (weeklyHours >= 38) return 18 * 7; // 18 jours × 7h = 126 heures
    if (weeklyHours >= 36) return 6 * 7;  // 6 jours × 7h = 42 heures
    return 0;
  };

  // Fonction pour calculer les heures de travail d'un jour selon le planning
  const getWorkingHoursForDay = (date: string): number => {
    const dayOfWeek = new Date(date).getDay();
    
    // Lundi à Vendredi = 7h, Samedi = 6h, Dimanche = 0h
    if (dayOfWeek === 0) return 0; // Dimanche
    if (dayOfWeek === 6) return 6; // Samedi
    return 7; // Lundi à Vendredi
  };

  // Fonction pour déduire les heures RTT d'une demande
  const deductRTTFromRequest = (request: any): number => {
    if (request.leave_type !== 'RTT') return 0;
    
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    let totalHours = 0;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      totalHours += getWorkingHoursForDay(d.toISOString().split('T')[0]);
    }
    
    return totalHours;
  };

  // Fonction pour calculer les CA et RTT de l'agent
  const calculateLeaveSummary = () => {
    // Récupérer les données de l'agent depuis localStorage
    let weeklyHours = 35; // Valeur par défaut
    let totalCADays = 25; // Valeur par défaut
    
    if (userSession) {
      try {
        const agentId = userSession?.id || userSession?.username || 'default_agent';
        const savedData = localStorage.getItem(`agent_${agentId}_hours`);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          weeklyHours = parsed.weeklyHours || 35;
          totalCADays = parsed.congésAnnuel || 25;
        }
      } catch (error) {
        console.error('Erreur lors du parsing des données localStorage:', error);
      }
    }
    
    const totalRTTHours = calculateRTT(weeklyHours);
    
    // Calculer les CA utilisés
    const agentRequests = getAgentRequests(userSession);
    const caRequests = agentRequests.filter(req => req.leave_type === 'Congés payés' && req.status === 'approuve');
    const usedCADays = caRequests.reduce((sum, req) => sum + req.days_count, 0);
    const remainingCADays = Math.max(0, totalCADays - usedCADays);
    
    // Calculer les RTT utilisés
    const rttRequests = agentRequests.filter(req => req.leave_type === 'RTT' && req.status === 'approuve');
    const usedRTTHours = rttRequests.reduce((sum, req) => sum + deductRTTFromRequest(req), 0);
    const remainingRTTHours = Math.max(0, totalRTTHours - usedRTTHours);
    
    return {
      ca: {
        total: totalCADays,
        used: usedCADays,
        remaining: remainingCADays
      },
      rtt: {
        total: totalRTTHours,
        used: usedRTTHours,
        remaining: remainingRTTHours
      }
    };
  };


  const handleCreateRequest = () => {
    console.log('🔄 Création d\'une nouvelle demande:', newRequest);
    
    if (!newRequest.leave_type || !newRequest.start_date || !newRequest.end_date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Calculer le nombre de jours
    const startDate = new Date(newRequest.start_date);
    const endDate = new Date(newRequest.end_date);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Créer la nouvelle demande
    const newLeaveRequest = {
      id: Date.now().toString(),
      leave_type: newRequest.leave_type,
      start_date: newRequest.start_date,
      end_date: newRequest.end_date,
      days_count: daysCount,
      reason: newRequest.reason || '',
      status: 'en_attente',
      created_at: new Date().toISOString()
    };

    console.log('📝 Nouvelle demande créée:', newLeaveRequest);

    // Sauvegarder dans all_leave_requests (source unique de vérité)
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    // Déterminer le nom de l'employé de manière plus robuste
    let employeeName = 'Agent Inconnu';
    if (userSession?.name) {
      employeeName = userSession.name;
    } else if (userSession?.username) {
      employeeName = userSession.username;
    } else if (userSession?.full_name) {
      employeeName = userSession.full_name;
    }
    
    const requestWithEmployeeName = {
      ...newLeaveRequest,
      employee_name: employeeName
    };
    
    allRequests.unshift(requestWithEmployeeName);
    localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));
    console.log('💾 Demande sauvegardée dans all_leave_requests:', requestWithEmployeeName);
    console.log('👤 Nom de l\'employé utilisé:', employeeName);

    // Réinitialiser le formulaire
    setNewRequest({
      leave_type: '',
      start_date: '',
      end_date: '',
      reason: ''
    });
    setShowCreateForm(false);

    alert('Demande créée avec succès !');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  if (!userSession) {
    return <Navigate to="/" replace />;
  }

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

  const leaveTypes = [
    'Congés payés',
    'Maladie',
    'Formation',
    'Maternité',
    'RTT',
    'ASA',
    'Autre'
  ];



  // Calcul automatique basé sur les demandes réelles
  const totalDays = 25; // Total de congés disponibles par an
  
  const agentRequests = getAgentRequests(userSession);
  const usedDays = agentRequests
    .filter(req => req.status === 'approuve')
    .reduce((sum, req) => sum + req.days_count, 0);
  
  const pendingDays = agentRequests
    .filter(req => req.status === 'en_attente')
    .reduce((sum, req) => sum + req.days_count, 0);
  
  const rejectedDays = agentRequests
    .filter(req => req.status === 'refuse')
    .reduce((sum, req) => sum + req.days_count, 0);
    
  const remainingDays = totalDays - usedDays - pendingDays;

  const leaveConsumption = {
    totalDays,
    usedDays,
    pendingDays,
    rejectedDays,
    remainingDays
  };

  const consumptionPercentage = (leaveConsumption.usedDays / leaveConsumption.totalDays) * 100;
  const pendingPercentage = (leaveConsumption.pendingDays / leaveConsumption.totalDays) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                👤 Tableau de bord Agent
              </h1>
              <Badge variant="outline" className="ml-4 bg-green-100 text-green-800">
                {userSession.service || 'Service'}
              </Badge>
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
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {agentRequests.filter(req => req.status === 'en_attente').length}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({pendingDays} jour{pendingDays > 1 ? 's' : ''})
                  </p>
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
                  <p className="text-2xl font-semibold text-gray-900">
                    {agentRequests.filter(req => req.status === 'approuve').length}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({usedDays} jour{usedDays > 1 ? 's' : ''})
                  </p>
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
                  <p className="text-2xl font-semibold text-gray-900">
                    {agentRequests.filter(req => req.status === 'refuse').length}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({rejectedDays} jour{rejectedDays > 1 ? 's' : ''})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total demandes</p>
                  <p className="text-2xl font-semibold text-gray-900">{agentRequests.length}</p>
                  <p className="text-xs text-gray-500">
                    ({usedDays + pendingDays + rejectedDays} jour{usedDays + pendingDays + rejectedDays > 1 ? 's' : ''})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Leave Consumption Visualization */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Consommation des congés 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progression de vos congés</span>
                    <span className="text-gray-600">
                      {leaveConsumption.usedDays + leaveConsumption.pendingDays} / {leaveConsumption.totalDays} jours
                    </span>
                  </div>
                  
                  {/* Barre de progression avec couleurs */}
                  <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                    {/* Congés utilisés (vert) */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500 ease-out"
                      style={{ width: `${consumptionPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 opacity-90"></div>
                    </div>
                    
                    {/* Congés en attente (jaune) */}
                    <div 
                      className="absolute top-0 h-full bg-yellow-500 transition-all duration-500 ease-out"
                      style={{ 
                        left: `${consumptionPercentage}%`, 
                        width: `${pendingPercentage}%` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-90"></div>
                    </div>
                    
                    {/* Reste disponible (gris clair) */}
                    <div 
                      className="absolute top-0 h-full bg-gray-300"
                      style={{ 
                        left: `${consumptionPercentage + pendingPercentage}%`, 
                        width: `${100 - consumptionPercentage - pendingPercentage}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Légende */}
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Utilisés ({leaveConsumption.usedDays} jours)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>En attente ({leaveConsumption.pendingDays} jours)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-300 rounded"></div>
                      <span>Disponibles ({leaveConsumption.remainingDays} jours)</span>
                    </div>
                  </div>
                </div>

                {/* Détails numériques */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{leaveConsumption.usedDays}</div>
                    <div className="text-sm text-gray-600">Utilisés</div>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{leaveConsumption.pendingDays}</div>
                    <div className="text-sm text-gray-600">En attente</div>
                  </div>
                  
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{leaveConsumption.rejectedDays}</div>
                    <div className="text-sm text-gray-600">Refusés</div>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{leaveConsumption.remainingDays}</div>
                    <div className="text-sm text-gray-600">Disponibles</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{leaveConsumption.totalDays}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>

                {/* Conseils */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Conseils</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Vous avez utilisé {consumptionPercentage.toFixed(0)}% de vos congés annuels ({usedDays} jours)</li>
                    <li>• Il vous reste {leaveConsumption.remainingDays} jours de congés disponibles</li>
                    <li>• Vous avez {pendingDays} jour{pendingDays > 1 ? 's' : ''} de congés en attente d'approbation</li>
                    {rejectedDays > 0 && (
                      <li>• {rejectedDays} jour{rejectedDays > 1 ? 's' : ''} de congés ont été refusés (non comptabilisés)</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Droits de congés - CA et RTT */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Carte Congés Annuels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Congés Annuels (CA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const leaveSummary = calculateLeaveSummary();
                  return (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{leaveSummary.ca.total}</div>
                        <div className="text-sm text-gray-500">jours par an</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Utilisés</span>
                          <span className="font-semibold text-red-600">{leaveSummary.ca.used} jours</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Restants</span>
                          <span className="font-semibold text-green-600">{leaveSummary.ca.remaining} jours</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(leaveSummary.ca.used / leaveSummary.ca.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Carte RTT */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Récupération (RTT)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const leaveSummary = calculateLeaveSummary();
                  return (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{leaveSummary.rtt.total}h</div>
                        <div className="text-sm text-gray-500">heures par an</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Utilisées</span>
                          <span className="font-semibold text-red-600">{leaveSummary.rtt.used}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Restantes</span>
                          <span className="font-semibold text-green-600">{leaveSummary.rtt.remaining}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${leaveSummary.rtt.total > 0 ? (leaveSummary.rtt.used / leaveSummary.rtt.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      {leaveSummary.rtt.total === 0 && (
                        <div className="text-xs text-gray-500 text-center">
                          Pas de RTT (35h/semaine)
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mes demandes</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  🔄 Actualiser
                </Button>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle demande
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentRequests.map((request) => (
                  <div key={request.id} className={`p-4 border rounded ${
                    request.status === 'en_attente' ? 'border-l-4 border-l-yellow-500' :
                    request.status === 'approuve' ? 'border-l-4 border-l-green-500' :
                    'border-l-4 border-l-red-500'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{request.leave_type}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Du:</span> {new Date(request.start_date).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Au:</span> {new Date(request.end_date).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Durée:</span> {request.days_count} jour(s)
                          </div>
                          <div>
                            <span className="font-medium">Créée le:</span> {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {request.reason && (
                          <div className="mt-2">
                            <span className="font-medium text-sm">Motif:</span>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nouvelle demande de congé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leave_type">Type de congé *</Label>
                <Select value={newRequest.leave_type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, leave_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">Date de fin *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Décrivez le motif de votre demande..."
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateRequest} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Soumettre la demande
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setNewRequest({
                    leave_type: '',
                    start_date: '',
                    end_date: '',
                    reason: ''
                  })}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Planning Personnel */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Mon Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Copier exactement le code de AgentProfile */}
              {userSession ? (
                <AgentScheduleSection agent={userSession} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Session utilisateur non trouvée</p>
                  <p className="text-xs mt-2">userSession: {JSON.stringify(userSession)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkingAgentDashboard;
