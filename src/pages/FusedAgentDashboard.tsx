import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LogOut, 
  Calendar, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  Gift, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  User,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  Users,
  BookOpen,
  Heart,
  Baby,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import ReadOnlySchedule from "@/components/ReadOnlySchedule";

interface Agent {
  id: string;
  name: string;
  service: string;
  role: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  status?: 'active' | 'inactive';
  weeklyHours?: number;
  rttDays?: number;
  congésAnnuel?: number;
  heuresFormation?: number;
  enfantMalade?: number;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'en_attente' | 'approuve' | 'refuse';
  created_at: string;
}

const FusedAgentDashboard = () => {
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedAgent, setEditedAgent] = useState<Agent | null>(null);
  const [savedSchedules, setSavedSchedules] = useState<any>({});
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<any[]>([]);
  const [currentWeekKey, setCurrentWeekKey] = useState<string>('');

  // Types de congés disponibles
  const leaveTypes = [
    'Congés payés',
    'Maladie',
    'Formation',
    'Maternité',
    'RTT',
    'ASA',
    'Autre'
  ];

  // Liste des rôles disponibles
  const availableRoles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'chef_service', label: 'Chef de Service' },
    { value: 'employe', label: 'Employé' },
    { value: 'medecin', label: 'Médecin' },
    { value: 'infirmiere', label: 'Infirmière' },
    { value: 'dentiste', label: 'Dentiste' },
    { value: 'assistante_dentaire', label: 'Assistante dentaire' },
    { value: 'rh', label: 'RH' },
    { value: 'comptabilite', label: 'Comptabilité' },
    { value: 'sage_femme', label: 'Sage-femme' }
  ];

  // Fonction pour obtenir le label d'un rôle
  const getRoleLabel = (roleValue: string) => {
    const role = availableRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  // Fonction pour calculer les heures de formation
  const calculateFormationHours = (weeklyHours: number, role: string): number => {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === 'chef_service' || normalizedRole === 'medecin' || normalizedRole === 'médecin') {
      return Math.round(weeklyHours * (3/8)); // 3/8ème des heures hebdomadaires
    }
    return 0;
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

  // Fonction pour calculer les RTT utilisés et restants
  const calculateRTTSummary = () => {
    if (!editedAgent) return { total: 0, used: 0, remaining: 0 };
    
    const agentRequests = getAgentRequests();
    const rttRequests = agentRequests.filter(req => req.leave_type === 'RTT' && req.status === 'approuve');
    
    const totalRTTHours = editedAgent.rttDays || calculateRTT(editedAgent.weeklyHours || 35);
    const usedRTTHours = rttRequests.reduce((sum, req) => sum + deductRTTFromRequest(req), 0);
    const remainingRTTHours = Math.max(0, totalRTTHours - usedRTTHours);
    
    return {
      total: totalRTTHours,
      used: usedRTTHours,
      remaining: remainingRTTHours
    };
  };

  // Fonction pour recharger les données depuis Supabase
  const reloadAgentFromSupabase = async () => {
    if (!editedAgent) return;
    
    try {
      console.log('🔄 Rechargement des données depuis Supabase...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', editedAgent.id)
        .single();

      if (error) {
        console.error('❌ Erreur lors du rechargement:', error);
        return;
      }

      if (data) {
        setEditedAgent({
          ...editedAgent,
          name: data.full_name || editedAgent.name,
          email: data.email || editedAgent.email,
          phone: data.phone || editedAgent.phone,
          role: data.role || editedAgent.role,
          service: data.service || editedAgent.service,
          hireDate: data.hire_date || editedAgent.hireDate
        });
        console.log('✅ Données rechargées depuis Supabase');
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement:', error);
    }
  };

  // Fonction pour obtenir les demandes de l'agent
  const getAgentRequests = (): LeaveRequest[] => {
    if (!editedAgent) return [];
    
    // Charger depuis localStorage uniquement
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    const agentRequests = allRequests.filter(req => {
      const isAgentRequest = req.employee_name === editedAgent.name || 
                            req.employee_name === editedAgent.username ||
                            req.employee_name === 'Sophie Bernard';
      
      const isNewRequest = new Date(req.created_at) > new Date('2025-09-20T00:00:00Z');
      
      return isAgentRequest && isNewRequest;
    });
    
    return agentRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  useEffect(() => {
    const session = sessionStorage.getItem('user_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        const agentRoles = ['employe', 'medecin', 'infirmiere', 'dentiste', 'assistante_dentaire', 'rh', 'comptabilite', 'sage_femme'];
        if (agentRoles.includes(userData.role)) {
          setUserSession(userData);
          initializeAgent(userData);
          loadLeaveRequests(userData);
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    }
    setLoading(false);
  }, []);

  // Charger les plannings sauvegardés
  useEffect(() => {
    if (!editedAgent) return;
    
    const loadAgentPlanning = () => {
      const saved = localStorage.getItem('savedSchedules');
      const weeklySchedules = localStorage.getItem('weeklySchedules');
      
      let allSchedules = {};
      
      if (saved) {
        try {
          allSchedules = { ...allSchedules, ...JSON.parse(saved) };
        } catch (error) {
          console.error('❌ Erreur parsing savedSchedules:', error);
        }
      }
      
      if (weeklySchedules) {
        try {
          allSchedules = { ...allSchedules, ...JSON.parse(weeklySchedules) };
        } catch (error) {
          console.error('❌ Erreur parsing weeklySchedules:', error);
        }
      }
      
      setSavedSchedules(allSchedules);
      
      // Chercher le planning de la semaine actuelle pour cet agent
      const currentWeek = new Date();
      const currentWeekKey = getScheduleKey(editedAgent.id, currentWeek);
      
      // Chercher TOUS les plannings pour cet agent
      const agentKeys = Object.keys(allSchedules).filter(key => key.includes(editedAgent.id));
      
      // Chercher d'abord le planning de la semaine actuelle
      if (allSchedules[currentWeekKey]) {
        const currentWeekSchedule = allSchedules[currentWeekKey];
        setCurrentWeekSchedule(currentWeekSchedule);
        setCurrentWeekKey(currentWeekKey);
      } else {
        // Pas de planning pour la semaine actuelle
        setCurrentWeekSchedule([]);
        setCurrentWeekKey(currentWeekKey); // Garder la clé de la semaine actuelle
      }
    };

    // Charger au montage
    loadAgentPlanning();

    // Écouter les événements de mise à jour des plannings
    const handlePlanningUpdate = () => {
      loadAgentPlanning();
    };

    window.addEventListener('planningUpdated', handlePlanningUpdate);
    
    return () => {
      window.removeEventListener('planningUpdated', handlePlanningUpdate);
    };
  }, [editedAgent?.id]);

  const getScheduleKey = (agentId: string, date: Date) => {
    // Créer une copie de la date pour éviter les modifications
    const weekStart = new Date(date);
    
    // Obtenir le jour de la semaine (0 = dimanche, 1 = lundi, etc.)
    const dayOfWeek = weekStart.getDay();
    
    // Calculer le lundi de la semaine
    // Si c'est dimanche (0), on recule de 6 jours, sinon on recule de (jour - 1) jours
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + daysToMonday);
    
    // Formater la date au format YYYY-MM-DD
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    const key = `${agentId}_${year}-${month}-${day}`;
    
    return key;
  };

  // Initialiser l'agent avec les données de session
  const initializeAgent = (userData: any) => {
    const agent: Agent = {
      id: userData.id || userData.username || 'default_agent',
      name: userData.name || userData.username || 'Agent',
      service: userData.service || 'Médecine',
      role: userData.role || 'employe',
      email: userData.email || '',
      phone: userData.phone || '',
      hireDate: userData.hireDate || '2023-01-01',
      weeklyHours: 35,
      rttDays: 0,
      congésAnnuel: 25,
      heuresFormation: 0,
      enfantMalade: 3
    };

    // Charger les données sauvegardées
    const savedData = localStorage.getItem(`agent_${agent.id}_hours`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        agent.weeklyHours = parsed.weeklyHours || 35;
        agent.rttDays = parsed.rttDays || calculateRTT(agent.weeklyHours || 35);
        agent.congésAnnuel = parsed.congésAnnuel || 25;
        agent.heuresFormation = calculateFormationHours(agent.weeklyHours || 35, agent.role);
        agent.enfantMalade = parsed.enfantMalade || 3;
      } catch (error) {
        console.error('Erreur lors du parsing des données localStorage:', error);
      }
    } else {
      agent.rttDays = calculateRTT(agent.weeklyHours || 35);
      agent.heuresFormation = calculateFormationHours(agent.weeklyHours || 35, agent.role);
    }

    setEditedAgent(agent);
  };

  // Charger les demandes depuis localStorage uniquement
  const loadLeaveRequests = (userData: any) => {
    console.log('🔄 Chargement des demandes pour:', userData.name || userData.username);
    
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    const agentRequests = allRequests.filter(req => {
      const isAgentRequest = req.employee_name === userData.name || 
                            req.employee_name === userData.username ||
                            req.employee_name === 'Sophie Bernard';
      
      const isNewRequest = new Date(req.created_at) > new Date('2025-09-20T00:00:00Z');
      
      return isAgentRequest && isNewRequest;
    });
    
    agentRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`📋 ${agentRequests.length} nouvelles demandes chargées pour l'agent`);
    setLeaveRequests(agentRequests);
  };

  // Créer une nouvelle demande
  const handleCreateRequest = () => {
    if (!newRequest.leave_type || !newRequest.start_date || !newRequest.end_date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const startDate = new Date(newRequest.start_date);
    const endDate = new Date(newRequest.end_date);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newLeaveRequest = {
      id: Date.now().toString(),
      leave_type: newRequest.leave_type,
      start_date: newRequest.start_date,
      end_date: newRequest.end_date,
      days_count: daysCount,
      reason: newRequest.reason || '',
      status: 'en_attente',
      created_at: new Date().toISOString(),
      employee_name: userSession?.name || userSession?.username || 'Agent Inconnu'
    };

    console.log('📝 Nouvelle demande créée:', newLeaveRequest);

    setLeaveRequests(prev => [newLeaveRequest, ...prev]);

    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    allRequests.unshift(newLeaveRequest);
    localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));
    console.log('💾 Demande sauvegardée dans all_leave_requests');

    setNewRequest({
      leave_type: '',
      start_date: '',
      end_date: '',
      reason: ''
    });
    setShowCreateForm(false);

    alert('Demande créée avec succès !');
  };

  // Actualiser les demandes
  const handleRefresh = () => {
    if (userSession) {
      loadLeaveRequests(userSession);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    window.location.href = '/';
  };

  // Fonctions de sauvegarde vers Supabase
  const handleSaveToSupabase = async () => {
    if (!editedAgent) return;
    
    try {
      setSaving(true);
      console.log('💾 Sauvegarde vers Supabase:', editedAgent);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editedAgent.name,
          email: editedAgent.email,
          phone: editedAgent.phone,
          role: editedAgent.role,
          service: editedAgent.service,
          hire_date: editedAgent.hireDate
        })
        .eq('id', editedAgent.id)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        alert(`Erreur lors de la sauvegarde: ${error.message}`);
        return;
      }

      console.log('✅ Sauvegarde réussie:', data);
      
      // Sauvegarder les heures hebdomadaires, RTT et droits de congés dans localStorage
      const agentData = {
        weeklyHours: editedAgent.weeklyHours,
        rttDays: editedAgent.rttDays,
        congésAnnuel: editedAgent.congésAnnuel,
        heuresFormation: editedAgent.heuresFormation,
        enfantMalade: editedAgent.enfantMalade,
        lastUpdated: new Date().toISOString()
      };
      console.log('💾 Sauvegarde dans localStorage:', agentData);
      localStorage.setItem(`agent_${editedAgent.id}_hours`, JSON.stringify(agentData));
      
      alert('✅ Fiche agent sauvegardée avec succès !');
      setIsEditing(false);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!editedAgent) return;
    
    setEditedAgent({
      ...editedAgent,
      weeklyHours: editedAgent.weeklyHours || 35,
      rttDays: editedAgent.rttDays || 0,
      congésAnnuel: editedAgent.congésAnnuel || 25,
      heuresFormation: calculateFormationHours(editedAgent.weeklyHours || 35, editedAgent.role),
      enfantMalade: editedAgent.enfantMalade || 3
    });
    setIsEditing(false);
  };

  // Fonctions utilitaires pour l'affichage
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return '✅';
      case 'break': return '☕';
      case 'off': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800 border-green-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'approuve': return 'bg-green-100 text-green-800';
      case 'refuse': return 'bg-red-100 text-red-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'approuve': return <CheckCircle className="h-4 w-4" />;
      case 'refuse': return <XCircle className="h-4 w-4" />;
      case 'en_attente': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Statistiques de l'agent
  const stats = {
    totalRequests: leaveRequests.length,
    approvedRequests: leaveRequests.filter(r => r.status === 'approuve').length,
    pendingRequests: leaveRequests.filter(r => r.status === 'en_attente').length,
    rejectedRequests: leaveRequests.filter(r => r.status === 'refuse').length,
    totalDaysUsed: leaveRequests.filter(r => r.status === 'approuve').reduce((sum, r) => sum + r.days_count, 0),
    totalDaysPending: leaveRequests.filter(r => r.status === 'en_attente').reduce((sum, r) => sum + r.days_count, 0)
  };

  // Fonctions pour gérer le planning de la semaine
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Récupérer et afficher le planning du responsable
  const renderResponsablePlanning = () => {
    if (!userSession || !editedAgent) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Session utilisateur non trouvée</p>
        </div>
      );
    }

    const weekStart = getWeekStart(currentWeek);
    const agentId = editedAgent.id;
    
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    const weekKey = `${agentId}_${year}-${month}-${day}`;
    
    console.log('🔍 Recherche planning responsable pour:', weekKey);
    
    const weeklySchedules = JSON.parse(localStorage.getItem('weeklySchedules') || '{}');
    const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules') || '{}');
    
    let foundSchedule = null;
    let foundKey = null;
    
    if (weeklySchedules[weekKey]) {
      foundSchedule = weeklySchedules[weekKey];
      foundKey = weekKey;
    } else if (savedSchedules[weekKey]) {
      foundSchedule = savedSchedules[weekKey];
      foundKey = weekKey;
    } else {
      const agentKeys = [
        ...Object.keys(weeklySchedules).filter(key => key.startsWith(agentId + '_')),
        ...Object.keys(savedSchedules).filter(key => key.startsWith(agentId + '_'))
      ];
      
      if (agentKeys.length > 0) {
        const latestKey = agentKeys.sort().pop();
        foundSchedule = weeklySchedules[latestKey] || savedSchedules[latestKey];
        foundKey = latestKey;
      }
    }
    
    if (!foundSchedule || !Array.isArray(foundSchedule)) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun planning trouvé pour cette semaine</p>
          <p className="text-sm text-gray-400 mt-2">
            Le responsable n'a pas encore créé de planning pour cette période
          </p>
        </div>
      );
    }
    
    return renderScheduleGrid(foundSchedule, foundKey);
  };

  // Afficher la grille du planning
  const renderScheduleGrid = (schedule: any[], weekKey: string) => {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const scheduleByDay: any = {};
    
    schedule.forEach(slot => {
      const dayName = days[slot.day] || 'Lundi';
      if (!scheduleByDay[dayName]) {
        scheduleByDay[dayName] = [];
      }
      scheduleByDay[dayName].push(slot);
    });
    
    return (
      <div>
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Planning du responsable</strong> - Clé: {weekKey}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {schedule.length} créneaux définis
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map(day => {
            const daySlots = scheduleByDay[day] || [];
            const workingSlots = daySlots.filter((slot: any) => slot.status === 'working');
            const morningSlot = workingSlots.find((slot: any) => slot.time === 'Matin');
            const afternoonSlot = workingSlots.find((slot: any) => slot.time === 'Après-midi');
            
            const hasMorning = morningSlot && morningSlot.status === 'working';
            const hasAfternoon = afternoonSlot && afternoonSlot.status === 'working';
            
            return (
              <div key={day} className="text-center border rounded-lg p-3">
                <div className="font-medium text-gray-900 mb-3">{day}</div>
                <div className="space-y-2">
                  {hasMorning ? (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {morningSlot.startTime}-{morningSlot.endTime}
                    </div>
                  ) : (
                    <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                      Non défini
                    </div>
                  )}
                  
                  {hasAfternoon ? (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {afternoonSlot.startTime}-{afternoonSlot.endTime}
                    </div>
                  ) : (
                    <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                      Non défini
                    </div>
                  )}
                  
                  <div className={`text-xs px-2 py-1 rounded ${
                    hasMorning || hasAfternoon 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {hasMorning || hasAfternoon ? 'Présent' : 'Absent'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  if (!userSession || !editedAgent) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Mon Tableau de bord</h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Annuler
              </Button>
              <Button onClick={handleSaveToSupabase} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          )}
        </div>

        {/* Informations générales */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profil principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mon Profil
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Annuler' : 'Modifier'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {editedAgent.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="name">Nom complet</Label>
                        <Input
                          id="name"
                          value={editedAgent.name}
                          onChange={(e) => setEditedAgent({...editedAgent, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Rôle</Label>
                        <Select
                          value={editedAgent.role}
                          onValueChange={(value) => setEditedAgent({...editedAgent, role: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-semibold">{editedAgent.name}</h2>
                      <p className="text-gray-600">{getRoleLabel(editedAgent.role)}</p>
                      <Badge variant="outline" className="mt-1">
                        {editedAgent.service}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={editedAgent.email || ''}
                        onChange={(e) => setEditedAgent({...editedAgent, email: e.target.value})}
                      />
                    </div>
                  ) : (
                    <span className="text-sm">
                      {editedAgent.email || `${editedAgent.name.toLowerCase().replace(' ', '.')}@hopital.fr`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={editedAgent.phone || ''}
                        onChange={(e) => setEditedAgent({...editedAgent, phone: e.target.value})}
                      />
                    </div>
                  ) : (
                    <span className="text-sm">
                      {editedAgent.phone || '06 12 34 56 78'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Label htmlFor="weeklyHours">Heures hebdomadaires</Label>
                      <Input
                        id="weeklyHours"
                        type="number"
                        value={editedAgent.weeklyHours || 35}
                        onChange={(e) => {
                          const hours = parseInt(e.target.value) || 35;
                          setEditedAgent({
                            ...editedAgent, 
                            weeklyHours: hours,
                            rttDays: calculateRTT(hours)
                          });
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        RTT automatique: {calculateRTT(editedAgent.weeklyHours || 35)} heures
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm">
                      {editedAgent.weeklyHours || 35}h/semaine - {editedAgent.rttDays || 0}h RTT
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Droits de congés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Droits de congés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Label htmlFor="congesAnnuel">Congés annuels (CA)</Label>
                      <Input
                        id="congesAnnuel"
                        type="number"
                        min="0"
                        max="50"
                        value={editedAgent.congésAnnuel || 25}
                        onChange={(e) => setEditedAgent({...editedAgent, congésAnnuel: parseInt(e.target.value) || 25})}
                      />
                      <p className="text-xs text-gray-500 mt-1">jours par an</p>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-sm font-medium">Congés annuels</span>
                      <div className="text-lg font-bold text-blue-600">
                        {editedAgent.congésAnnuel || 25} jours
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">RTT</span>
                    <div className="text-lg font-bold text-green-600">
                      {editedAgent.rttDays || 0} heures
                    </div>
                  </div>
                </div>
                
                {editedAgent.heuresFormation > 0 && (
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">Formation</span>
                      <div className="text-lg font-bold text-purple-600">
                        {editedAgent.heuresFormation} heures
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Enfant malade</span>
                    <div className="text-lg font-bold text-red-600">
                      {editedAgent.enfantMalade || 3} jours
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques des demandes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Mes demandes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">En attente</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-sm text-gray-600">Approuvées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-gray-600">Refusées</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planning du responsable */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Mon planning hebdomadaire</CardTitle>
              <div className="flex items-center space-x-2">
                <Button onClick={goToPreviousWeek} variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Semaine précédente
                </Button>
                <Button onClick={goToCurrentWeek} variant="outline" size="sm">
                  Cette semaine
                </Button>
                <Button onClick={goToNextWeek} variant="outline" size="sm">
                  Semaine suivante
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Du {getWeekStart(currentWeek).toLocaleDateString('fr-FR')} au {getWeekEnd(currentWeek).toLocaleDateString('fr-FR')}
            </p>
          </CardHeader>
          <CardContent>
            {renderResponsablePlanning()}
          </CardContent>
        </Card>

        {/* Actions pour les demandes */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Mes demandes de congés</h2>
          <div className="flex space-x-3">
            <Button onClick={handleRefresh} variant="outline">
              🔄 Actualiser
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          </div>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Nouvelle demande de congé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leave_type">Type de congé</Label>
                  <Select value={newRequest.leave_type} onValueChange={(value) => setNewRequest({...newRequest, leave_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({...newRequest, start_date: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({...newRequest, end_date: e.target.value})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="reason">Motif</Label>
                  <Textarea
                    id="reason"
                    placeholder="Raison de la demande..."
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateRequest}>
                  Créer la demande
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des demandes */}
        <Card>
          <CardContent className="p-6">
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune demande de congé trouvée</p>
                <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer ma première demande
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{request.leave_type}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Du: {new Date(request.start_date).toLocaleDateString('fr-FR')} Au: {new Date(request.end_date).toLocaleDateString('fr-FR')}</p>
                          <p>Durée: {request.days_count} jour(s)</p>
                          <p>Créée le: {new Date(request.created_at).toLocaleDateString('fr-FR')}</p>
                          {request.reason && <p>Motif: {request.reason}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FusedAgentDashboard;
