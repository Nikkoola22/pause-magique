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
import AgentPersonalInfo from "@/components/AgentPersonalInfo";
import AgentLeaveRights from "@/components/AgentLeaveRights";

const WorkingAgentDashboard = () => {
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    start_time: '',
    end_time: ''
  });
  // Variable mockRequests supprimée - utilisation directe de getAgentRequests

  // Fonction pour récupérer les demandes de l'agent depuis localStorage
  const getAgentRequests = (userSessionData?: any) => {
    if (!userSessionData) return [];
    
    // Charger depuis all_leave_requests (source unique de vérité)
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    // Filtrer les demandes de cet agent
    // Chercher d'abord par agent_id, puis par employee_name
    const agentRequests = allRequests.filter(req => {
      const agentId = userSessionData.id || userSessionData.username;
      const isAgentRequest = (req.agent_id && req.agent_id === agentId) ||
                            req.employee_name === userSessionData.name || 
                            req.employee_name === userSessionData.username;
      
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
    
    try {
      const [startYear, startMonth, startDay] = request.start_date.split('-').map(Number);
      const [endYear, endMonth, endDay] = request.end_date.split('-').map(Number);
      
      // Validation des dates
      if (isNaN(startYear) || isNaN(startMonth) || isNaN(startDay)) {
        console.warn('⚠️ Format de date invalide pour start_date:', request.start_date);
        return 0;
      }
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      let totalHours = 0;
      const currentDate = new Date(startDate);
      
      // Boucle correcte pour éviter la boucle infinie
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        totalHours += getWorkingHoursForDay(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return totalHours;
    } catch (error) {
      console.error('❌ Erreur dans deductRTTFromRequest:', error, request);
      return 0;
    }
  };

  // Fonction pour récupérer les horaires de travail du planning pour une date donnée
  const getScheduledHours = (agentId: string, dateStr: string): { startTime?: string; endTime?: string } => {
    const savedSchedules = JSON.parse(localStorage.getItem('weeklySchedules') || '{}');
    
    // Parser la date
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Obtenir le nom du jour en français
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[date.getDay()];
    
    // Générer la clé de planning (lundi de la semaine)
    const weekStart = new Date(date);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + daysToMonday);
    
    const keyYear = weekStart.getFullYear();
    const keyMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
    const keyDay = String(weekStart.getDate()).padStart(2, '0');
    const scheduleKey = `${agentId}_${keyYear}-${keyMonth}-${keyDay}`;
    
    console.log(`🔍 Recherche horaires pour ${dateStr} (${dayName}), clé: ${scheduleKey}`);
    
    const schedule = savedSchedules[scheduleKey];
    if (schedule) {
      // Chercher les créneaux de travail (morning + afternoon) pour ce jour
      const slots = schedule.filter(slot => slot.day === dayName && slot.status === 'working');
      
      if (slots.length > 0) {
        const morning = slots.find(s => s.time === 'Matin');
        const afternoon = slots.find(s => s.time === 'Après-midi');
        
        // Prendre le premier créneau (matin) et le dernier (après-midi) s'il existe
        const firstSlot = morning || slots[0];
        const lastSlot = afternoon || slots[slots.length - 1];
        
        console.log(`✅ Horaires trouvés: ${firstSlot.startTime} - ${lastSlot.endTime}`);
        return {
          startTime: firstSlot.startTime,
          endTime: lastSlot.endTime
        };
      }
    }
    
    console.log(`⚠️ Pas d'horaires trouvés pour ${dateStr}`);
    return {};
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
    try {
      console.log('🔄 Création d\'une nouvelle demande:', newRequest);
      
      if (!newRequest.leave_type || !newRequest.start_date || !newRequest.end_date) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Validation du format de date (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newRequest.start_date) || !dateRegex.test(newRequest.end_date)) {
        throw new Error('Format de date invalide. Utilisez le format YYYY-MM-DD');
      }

      // Calculer le nombre de jours et les heures RTT
      const [startYear, startMonth, startDay] = newRequest.start_date.split('-').map(Number);
      const [endYear, endMonth, endDay] = newRequest.end_date.split('-').map(Number);
      
      // Validation des dates
      if (isNaN(startYear) || isNaN(startMonth) || isNaN(startDay) ||
          isNaN(endYear) || isNaN(endMonth) || isNaN(endDay)) {
        throw new Error('Dates invalides: composants non-numériques');
      }
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      // Vérifier que la date de fin >= date de début
      if (startDate > endDate) {
        throw new Error('La date de fin doit être >= la date de début');
      }
      
      // Vérifier que ce n\'est pas dans le passé
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate < today) {
        throw new Error('Impossible de créer une demande pour des dates passées');
      }
    
    let daysCount = 0;
    let rttHours = 0;
    let startTimeFromPlanning: string | undefined;
    let endTimeFromPlanning: string | undefined;
    
    // Déterminer le nom de l'employé et agent_id de manière robuste
    let employeeName = 'Agent Inconnu';
    let agentId = userSession?.username || userSession?.id || 'default_agent';
    
    if (userSession?.name) {
      employeeName = userSession.name;
    } else if (userSession?.username) {
      employeeName = userSession.username;
    } else if (userSession?.full_name) {
      employeeName = userSession.full_name;
    }

    // Parcourir les jours du congé
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // Compter tous les jours sauf dimanche
      if (dayOfWeek !== 0) {
        daysCount++;
        
        // Pour RTT : gérer les horaires
        if (newRequest.leave_type === 'RTT') {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Si pas d'horaires renseignés, les récupérer du planning
          if (!newRequest.start_time && !newRequest.end_time) {
            const plannedHours = getScheduledHours(agentId, dateStr);
            
            // Utiliser les horaires du premier jour comme référence
            if (daysCount === 1 && plannedHours.startTime && plannedHours.endTime) {
              startTimeFromPlanning = plannedHours.startTime;
              endTimeFromPlanning = plannedHours.endTime;
            }
            
            // Calculer les heures basées sur les horaires trouvés
            if (plannedHours.startTime && plannedHours.endTime) {
              const [sH, sM] = plannedHours.startTime.split(':').map(Number);
              const [eH, eM] = plannedHours.endTime.split(':').map(Number);
              const hoursWorked = (eH - sH) + (eM - sM) / 60;
              rttHours += hoursWorked;
              console.log(`  ${dateStr}: ${plannedHours.startTime}-${plannedHours.endTime} = ${hoursWorked}h`);
            } else {
              // Fallback : heures standard par jour
              const workingHours = getWorkingHoursForDay(dateStr);
              rttHours += workingHours;
              console.log(`  ${dateStr}: heures standard = ${workingHours}h`);
            }
          } else {
            // Horaires renseignés manuellement
            const [sH, sM] = newRequest.start_time.split(':').map(Number);
            const [eH, eM] = newRequest.end_time.split(':').map(Number);
            const hoursWorked = (eH - sH) + (eM - sM) / 60;
            rttHours += hoursWorked;
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Créer la nouvelle demande
    const newLeaveRequest = {
      id: Date.now().toString(),
      leave_type: newRequest.leave_type,
      start_date: newRequest.start_date,
      end_date: newRequest.end_date,
      days_count: daysCount,
      reason: newRequest.reason || '',
      status: 'en_attente',
      created_at: new Date().toISOString(),
      ...(newRequest.leave_type === 'RTT' && {
        rtt_hours: rttHours,
        start_time: newRequest.start_time || startTimeFromPlanning || '',
        end_time: newRequest.end_time || endTimeFromPlanning || ''
      })
    };

    console.log('📝 Nouvelle demande créée:', newLeaveRequest);
    console.log('🕐 RTT - Horaires utilisés:', { startTimeFromPlanning, endTimeFromPlanning, rttHours });

    // Sauvegarder dans all_leave_requests (source unique de vérité)
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    const requestWithEmployeeName = {
      ...newLeaveRequest,
      employee_name: employeeName,
      agent_id: agentId
    };
    
    allRequests.unshift(requestWithEmployeeName);
    localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));
    console.log('💾 Demande sauvegardée dans all_leave_requests:', requestWithEmployeeName);
    console.log('👤 Agent ID utilisé:', agentId);
    console.log('👤 Nom de l\'employé utilisé:', employeeName);

    // Réinitialiser le formulaire
    setNewRequest({
      leave_type: '',
      start_date: '',
      end_date: '',
      reason: '',
      start_time: '',
      end_time: ''
    });
    setShowCreateForm(false);

    alert('✅ Demande créée avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      alert('❌ Erreur: ' + (error instanceof Error ? error.message : 'Une erreur est survenue'));
    }
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



        {/* Informations personnelles et droits de congés */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <AgentPersonalInfo 
              agent={{
                id: userSession.id,
                name: userSession.name,
                role: userSession.role,
                service: userSession.service,
                email: userSession.email,
                phone: userSession.phone,
                hireDate: userSession.hireDate,
                weeklyHours: userSession.weeklyHours,
                rttDays: userSession.rttDays,
                specialization: userSession.specialization
              }}
              showFullInfo={true}
            />
            
            {/* Droits de congés */}
            <AgentLeaveRights 
              agent={{
                id: userSession.id,
                name: userSession.name,
                role: userSession.role,
                weeklyHours: userSession.weeklyHours,
                rttDays: userSession.rttDays,
                congésAnnuel: userSession.congésAnnuel,
                heuresFormation: userSession.heuresFormation,
                enfantMalade: userSession.enfantMalade
              }}
              leaveRequests={agentRequests}
              showDetails={true}
            />
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
                          {request.leave_type === 'RTT' && (request.rtt_hours ? (
                            <div>
                              <span className="font-medium">RTT:</span> {request.rtt_hours}h
                            </div>
                          ) : null)}
                          {request.leave_type === 'RTT' && request.start_time && request.end_time && (
                            <div>
                              <span className="font-medium">Plage horaire:</span> {request.start_time} - {request.end_time}
                            </div>
                          )}
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

              {/* Champs horaires pour RTT */}
              {newRequest.leave_type === 'RTT' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Heure de début</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newRequest.start_time}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, start_time: e.target.value }))}
                      placeholder="09:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Heure de fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newRequest.end_time}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, end_time: e.target.value }))}
                      placeholder="17:00"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-gray-600">
                    💡 Optionnel : Si vous laissez vide, les horaires du planning seront utilisés automatiquement
                  </p>
                </div>
              )}
              
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
                    reason: '',
                    start_time: '',
                    end_time: ''
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
