import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  TrendingUp,
  Users,
  Award,
  Gift,
  BookOpen,
  Heart,
  Baby,
  Plus
} from "lucide-react";
import ReadOnlySchedule from "../components/ReadOnlySchedule";
import WeeklySchedule from "../components/WeeklySchedule";

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
  // Nouveaux champs pour les droits de congés
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

const NewAgentDashboard = () => {
  // Récupérer la session utilisateur
  const [userSession, setUserSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialiser l'agent à partir de la session
  const [agent, setAgent] = useState<Agent | null>(null);
  // Liste des rôles disponibles (correspondant aux valeurs de l'enum Supabase)
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

  // Fonction pour obtenir le label d'un rôle à partir de sa valeur
  const getRoleLabel = (roleValue: string) => {
    const role = availableRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  // Fonction pour calculer les heures de formation (pour les médecins et chefs de service)
  const calculateFormationHours = (weeklyHours: number, role: string): number => {
    // Normaliser le rôle en minuscule pour la comparaison
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === 'chef_service' || normalizedRole === 'medecin' || normalizedRole === 'médecin') {
      const hours = Math.round(weeklyHours * (3/8)); // 3/8ème des heures hebdomadaires
      console.log('🧮 Calcul heures formation:', { weeklyHours, role, normalizedRole, result: hours });
      return hours;
    }
    console.log('🧮 Pas de formation pour le rôle:', { role, normalizedRole });
    return 0; // Pas de formation pour les autres rôles
  };

  // Fonction pour calculer les heures de travail d'un jour selon le planning
  const getWorkingHoursForDay = (date: string): number => {
    // Par défaut, on considère 7h par jour de travail
    // TODO: Implémenter la logique basée sur le planning réel de l'agent
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

  // Fonction pour calculer les RTT utilisés et restants
  const calculateRTTSummary = () => {
    if (!editedAgent) return { total: 0, used: 0, remaining: 0 };
    
    const agentRequests = getAgentRequests(editedAgent);
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
    if (!agent) return;
    
    try {
      console.log('🔄 Rechargement des données depuis Supabase...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agent.id)
        .single();

      if (error) {
        console.error('❌ Erreur lors du rechargement:', error);
        return;
      }

      if (data) {
        console.log('✅ Données rechargées:', data);
        // Mettre à jour l'agent avec les données de Supabase
        const updatedAgent = {
          ...agent,
          name: data.full_name,
          email: data.email,
          phone: data.phone,
          role: data.role,
          service: data.service,
          hireDate: data.hire_date
        };
        
        // Mettre à jour l'état local
        setEditedAgent(updatedAgent);
        Object.assign(agent, updatedAgent);
        
        console.log('✅ Agent mis à jour avec les données Supabase:', updatedAgent);
      }
    } catch (error) {
      console.error('❌ Erreur lors du rechargement:', error);
    }
  };

  // États pour la gestion des plannings (supprimés - utilisation du composant WeeklySchedule)
  const [isEditing, setIsEditing] = useState(false);
  const [editedAgent, setEditedAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialiser l'agent à partir de la session
  useEffect(() => {
    const sessionData = sessionStorage.getItem('user_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUserSession(session);
        
        // Créer l'agent à partir de la session
        const agentData: Agent = {
          id: session.id,
          name: session.name,
          service: session.service || 'Médecine',
          role: session.role || 'employe',
          email: session.email,
          phone: session.phone,
          hireDate: session.hireDate,
          status: 'active',
          weeklyHours: 35,
          rttDays: 0,
          congésAnnuel: 25,
          heuresFormation: 0,
          enfantMalade: 3
        };
        
        setAgent(agentData);
        // Initialiser editedAgent immédiatement
        setEditedAgent(agentData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du parsing de la session:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Mettre à jour editedAgent quand agent change
  useEffect(() => {
    if (!agent) return;
    
    // Charger les données depuis localStorage si elles existent
    const savedData = localStorage.getItem(`agent_${agent.id}_hours`);
    let weeklyHours = agent.weeklyHours || 35;
    let rttDays = agent.rttDays || 0;
    let congésAnnuel = agent.congésAnnuel || 25;
    let heuresFormation = agent.heuresFormation || 40;
    let enfantMalade = agent.enfantMalade || 3;
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        weeklyHours = parsed.weeklyHours || weeklyHours;
        rttDays = parsed.rttDays || rttDays;
        congésAnnuel = parsed.congésAnnuel || congésAnnuel;
        // Recalculer les heures de formation selon le rôle
        heuresFormation = calculateFormationHours(weeklyHours, agent.role);
        enfantMalade = parsed.enfantMalade || enfantMalade;
        console.log('📂 Données chargées depuis localStorage:', parsed);
        console.log('📊 Heures de formation recalculées:', heuresFormation, 'pour rôle:', agent.role);
      } catch (error) {
        console.error('Erreur lors du parsing des données localStorage:', error);
      }
    } else {
      // Si pas de données sauvegardées, calculer selon le rôle
      heuresFormation = calculateFormationHours(weeklyHours, agent.role);
      console.log('📊 Heures de formation calculées:', heuresFormation, 'pour rôle:', agent.role);
    }
    
    setEditedAgent({
      ...agent,
      weeklyHours,
      rttDays,
      congésAnnuel,
      heuresFormation,
      enfantMalade
    });
  }, [agent]);

  // Fonction pour formater la date d'embauche
  const formatHireDate = (date: string): string => {
    if (!date) return '';
    
    // Si c'est déjà au format "Mois YYYY", le retourner tel quel
    if (date.includes('Mars') || date.includes('Janvier') || date.includes('Février') || 
        date.includes('Avril') || date.includes('Mai') || date.includes('Juin') ||
        date.includes('Juillet') || date.includes('Août') || date.includes('Septembre') ||
        date.includes('Octobre') || date.includes('Novembre') || date.includes('Décembre')) {
      return date;
    }
    
    // Si c'est au format ISO, le convertir
    try {
      const dateObj = new Date(date);
      const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    } catch (error) {
      return date;
    }
  };

  // Fonction pour formater le service
  const formatService = (service: string): string => {
    if (!service) return '';
    
    // Si c'est déjà au format français, le retourner tel quel
    if (service === 'Médecine' || service === 'Chirurgie' || service === 'Urgences' || 
        service === 'Pédiatrie' || service === 'Gynécologie' || service === 'Cardiologie' ||
        service === 'Neurologie' || service === 'Radiologie' || service === 'Laboratoire' ||
        service === 'Pharmacie' || service === 'Administration' || service === 'Ressources Humaines' ||
        service === 'Comptabilité') {
      return service;
    }
    
    // Si c'est au format enum (minuscules), le convertir
    const serviceMap: { [key: string]: string } = {
      'medecine': 'Médecine',
      'chirurgie': 'Chirurgie',
      'urgences': 'Urgences',
      'pediatrie': 'Pédiatrie',
      'gynecologie': 'Gynécologie',
      'cardiologie': 'Cardiologie',
      'neurologie': 'Neurologie',
      'radiologie': 'Radiologie',
      'laboratoire': 'Laboratoire',
      'pharmacie': 'Pharmacie',
      'administration': 'Administration',
      'rh': 'Ressources Humaines',
      'comptabilite': 'Comptabilité'
    };
    
    return serviceMap[service.toLowerCase()] || service;
  };

  // Fonction pour calculer les RTT en heures selon les heures hebdomadaires
  const calculateRTT = (weeklyHours: number): number => {
    if (weeklyHours >= 38) return 18 * 7; // 18 jours × 7h = 126 heures
    if (weeklyHours >= 36) return 6 * 7;  // 6 jours × 7h = 42 heures
    return 0;
  };

  // Fonctions de sauvegarde vers Supabase
  const handleSaveToSupabase = async () => {
    try {
      setSaving(true);
      console.log('💾 Sauvegarde vers Supabase:', editedAgent);
      console.log('💾 Rôle sélectionné:', editedAgent.role);
      console.log('💾 ID de l\'agent:', editedAgent.id);
      console.log('💾 Agent original:', agent);
      console.log('💾 Données de droits de congés:', {
        congésAnnuel: editedAgent.congésAnnuel,
        heuresFormation: editedAgent.heuresFormation,
        enfantMalade: editedAgent.enfantMalade,
        rttDays: editedAgent.rttDays
      });
      
      // Vérifier que le rôle est valide
      const validRoles = ['admin', 'chef_service', 'employe', 'medecin', 'infirmiere', 'dentiste', 'assistante_dentaire', 'rh', 'comptabilite', 'sage_femme'];
      if (!validRoles.includes(editedAgent.role)) {
        console.error('❌ Rôle invalide:', editedAgent.role);
        alert(`Rôle invalide: ${editedAgent.role}`);
        return;
      }
      
      // Vérifier que l'ID est valide (UUID)
      if (!editedAgent.id || editedAgent.id.length < 10) {
        console.error('❌ ID invalide:', editedAgent.id);
        alert(`ID invalide: ${editedAgent.id}`);
        return;
      }
      
      // Convertir la date d'embauche en format ISO si nécessaire
      let hireDate = editedAgent.hireDate;
      if (hireDate && typeof hireDate === 'string' && !hireDate.includes('-')) {
        // Si c'est un format comme "Mars 2022", convertir en date valide
        if (hireDate.includes('Mars')) {
          hireDate = '2022-03-01';
        } else if (hireDate.includes('Janvier')) {
          hireDate = '2022-01-01';
        } else if (hireDate.includes('Février')) {
          hireDate = '2022-02-01';
        } else if (hireDate.includes('Avril')) {
          hireDate = '2022-04-01';
        } else if (hireDate.includes('Mai')) {
          hireDate = '2022-05-01';
        } else if (hireDate.includes('Juin')) {
          hireDate = '2022-06-01';
        } else if (hireDate.includes('Juillet')) {
          hireDate = '2022-07-01';
        } else if (hireDate.includes('Août')) {
          hireDate = '2022-08-01';
        } else if (hireDate.includes('Septembre')) {
          hireDate = '2022-09-01';
        } else if (hireDate.includes('Octobre')) {
          hireDate = '2022-10-01';
        } else if (hireDate.includes('Novembre')) {
          hireDate = '2022-11-01';
        } else if (hireDate.includes('Décembre')) {
          hireDate = '2022-12-01';
        }
      }

      // Convertir le service en valeur valide pour l'enum
      let serviceValue = editedAgent.service;
      if (serviceValue === 'Médecine') {
        serviceValue = 'medecine';
      } else if (serviceValue === 'Chirurgie') {
        serviceValue = 'chirurgie';
      } else if (serviceValue === 'Urgences') {
        serviceValue = 'urgences';
      } else if (serviceValue === 'Pédiatrie') {
        serviceValue = 'pediatrie';
      } else if (serviceValue === 'Gynécologie') {
        serviceValue = 'gynecologie';
      } else if (serviceValue === 'Cardiologie') {
        serviceValue = 'cardiologie';
      } else if (serviceValue === 'Neurologie') {
        serviceValue = 'neurologie';
      } else if (serviceValue === 'Radiologie') {
        serviceValue = 'radiologie';
      } else if (serviceValue === 'Laboratoire') {
        serviceValue = 'laboratoire';
      } else if (serviceValue === 'Pharmacie') {
        serviceValue = 'pharmacie';
      } else if (serviceValue === 'Administration') {
        serviceValue = 'administration';
      } else if (serviceValue === 'Ressources Humaines') {
        serviceValue = 'rh';
      } else if (serviceValue === 'Comptabilité') {
        serviceValue = 'comptabilite';
      } else {
        // Valeur par défaut si le service n'est pas reconnu
        serviceValue = 'medecine';
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editedAgent.name,
          email: editedAgent.email,
          phone: editedAgent.phone,
          role: editedAgent.role as any,
          service: serviceValue as any,
          hire_date: hireDate
          // Note: weekly_hours et rtt_days ne sont pas dans la table profiles
          // Ils sont stockés localement dans editedAgent
        })
        .eq('id', editedAgent.id)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        console.error('❌ Détails de l\'erreur:', error.details, error.hint, error.code);
        alert(`Erreur lors de la sauvegarde: ${error.message}`);
        return;
      }

      console.log('✅ Sauvegarde réussie:', data);
      console.log('✅ Données retournées par Supabase:', data);
      
      // Vérifier si des données ont été retournées
      if (!data || data.length === 0) {
        console.error('❌ Aucune donnée retournée par Supabase');
        alert('Erreur: Aucune donnée retournée par la sauvegarde');
        return;
      }
      
      // Mettre à jour l'agent local avec les nouvelles données
      const updatedAgent = {
        ...agent,
        name: editedAgent.name,
        email: editedAgent.email,
        phone: editedAgent.phone,
        role: editedAgent.role, // ⚠️ IMPORTANT: Inclure le rôle mis à jour
        hireDate: editedAgent.hireDate,
        weeklyHours: editedAgent.weeklyHours,
        rttDays: editedAgent.rttDays,
        congésAnnuel: editedAgent.congésAnnuel,
        heuresFormation: calculateFormationHours(editedAgent.weeklyHours || 35, editedAgent.role), // Recalcul automatique
        enfantMalade: editedAgent.enfantMalade
      };
      
      console.log('🔄 Agent mis à jour:', updatedAgent);
      
      // Mettre à jour l'état local (editedAgent)
      setEditedAgent(updatedAgent);
      
      // Mettre à jour l'agent parent (pour l'affichage)
      if (agent && editedAgent.id === editedAgent.id) {
        // Mettre à jour l'objet agent parent avec les nouvelles données
        Object.assign(agent, updatedAgent);
        console.log('🔄 Agent parent mis à jour:', agent);
      }
      
      // Sauvegarder les heures hebdomadaires, RTT et droits de congés dans localStorage
      const agentData = {
        weeklyHours: updatedAgent.weeklyHours,
        rttDays: updatedAgent.rttDays,
        congésAnnuel: updatedAgent.congésAnnuel,
        heuresFormation: updatedAgent.heuresFormation,
        enfantMalade: updatedAgent.enfantMalade,
        lastUpdated: new Date().toISOString()
      };
      console.log('💾 Sauvegarde dans localStorage:', agentData);
      localStorage.setItem(`agent_${updatedAgent.id}_hours`, JSON.stringify(agentData));
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('agentDataUpdated', { 
        detail: { agentId: updatedAgent.id, agentData } 
      }));
      
      // Déclencher un événement pour forcer le rechargement des données
      window.dispatchEvent(new CustomEvent('agentProfileUpdated', { 
        detail: { agentId: updatedAgent.id, updatedAgent } 
      }));
      
      alert('✅ Fiche agent sauvegardée avec succès !');
      setIsEditing(false);
      
      // Recharger les données depuis Supabase pour s'assurer de la synchronisation
      setTimeout(() => {
        reloadAgentFromSupabase();
      }, 500);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedAgent({
      ...agent,
      weeklyHours: agent.weeklyHours || 35,
      rttDays: agent.rttDays || 0,
      congésAnnuel: agent.congésAnnuel || 25,
      heuresFormation: calculateFormationHours(agent.weeklyHours || 35, agent.role),
      enfantMalade: agent.enfantMalade || 3
    });
    setIsEditing(false);
  };

  // Données personnalisées selon l'agent
  // Fonction pour récupérer les vraies demandes de congés depuis localStorage
  const getAgentRequests = (agent: Agent): LeaveRequest[] => {
    if (!agent) return [];
    
    // Charger depuis all_leave_requests (source unique de vérité)
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    // Filtrer les demandes de cet agent
    const agentRequests = allRequests.filter(req => {
      const isAgentRequest = req.employee_name === agent.name || 
                            req.employee_name === agent.email ||
                            req.employee_name === 'Sophie Bernard';
      
      return isAgentRequest;
    });
    
    // Trier par date de création (plus récent en premier)
    agentRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return agentRequests;
  };

  // Gestion des demandes de congés
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  // Variable leaveRequests supprimée - utilisation de getAgentRequests

  // Types de congés disponibles
  const leaveTypes = [
    'Congés payés',
    'RTT',
    'Formation',
    'Maladie',
    'ASA',
    'Autres'
  ];

  // Chargement des demandes supprimé - utilisation de getAgentRequests

  // Créer une nouvelle demande
  const handleCreateRequest = () => {
    if (!newRequest.leave_type || !newRequest.start_date || !newRequest.end_date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const startDate = new Date(newRequest.start_date);
    const endDate = new Date(newRequest.end_date);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newLeaveRequest: LeaveRequest = {
      id: Date.now().toString(),
      leave_type: newRequest.leave_type,
      start_date: newRequest.start_date,
      end_date: newRequest.end_date,
      days_count: daysCount,
      reason: newRequest.reason || '',
      status: 'en_attente',
      created_at: new Date().toISOString()
    };

    // Ajouter à la liste locale
    // Mise à jour supprimée - les demandes sont maintenant chargées dynamiquement

    // Sauvegarder dans localStorage
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    allRequests.unshift({
      ...newLeaveRequest,
      employee_name: agent?.name || 'Agent Inconnu'
    });
    localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));

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

  // Charger les demandes au montage
  // Chargement des demandes supprimé - utilisation de getAgentRequests

  const agentRequests = editedAgent ? getAgentRequests(editedAgent) : [];

  // Chargement des plannings supprimé - utilisation du composant WeeklySchedule

  // Fonction getScheduleKey supprimée - utilisation du composant WeeklySchedule

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
    totalRequests: agentRequests.length,
    approvedRequests: agentRequests.filter(r => r.status === 'approuve').length,
    pendingRequests: agentRequests.filter(r => r.status === 'en_attente').length,
    rejectedRequests: agentRequests.filter(r => r.status === 'refuse').length,
    totalDaysUsed: agentRequests.filter(r => r.status === 'approuve').reduce((sum, r) => sum + r.days_count, 0),
    totalDaysPending: agentRequests.filter(r => r.status === 'en_attente').reduce((sum, r) => sum + r.days_count, 0)
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  if (!userSession || !agent || !editedAgent) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header avec bouton déconnexion */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              sessionStorage.removeItem('user_session');
              window.location.href = '/';
            }} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Déconnexion
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Agent</h1>
          {/* Boutons de modification cachés pour le dashboard agent */}
          {false && !isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Modifier
            </Button>
          ) : false ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                Annuler
              </Button>
              <Button onClick={handleSaveToSupabase} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          ) : null}
        </div>

        {/* Informations générales */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profil principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={reloadAgentFromSupabase}
                  title="Recharger les données depuis Supabase"
                >
                  🔄
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
                          onValueChange={(value) => {
                            console.log('🎯 Rôle sélectionné dans le menu:', value);
                            setEditedAgent({...editedAgent, role: value});
                          }}
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
                          {/* Debug: Afficher le rôle brut pour vérification */}
                          <p className="text-xs text-gray-400">Rôle brut: {editedAgent.role}</p>
                          <Badge variant="outline" className="mt-1">
                            {formatService(editedAgent.service)}
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
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Label htmlFor="hireDate">Date d'embauche</Label>
                      <Input
                        id="hireDate"
                        value={editedAgent.hireDate || ''}
                        onChange={(e) => setEditedAgent({...editedAgent, hireDate: e.target.value})}
                      />
                    </div>
                  ) : (
                        <span className="text-sm">
                          En poste depuis {formatHireDate(editedAgent.hireDate || '2023-01-01')}
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
                {editedAgent.name === 'Sophie Bernard' && (
                  <div className="flex items-center gap-3">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Infirmière expérimentée - Spécialisation urgences</span>
                  </div>
                )}
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
                      {(() => {
                        const agentRequests = getAgentRequests(agent);
                        const caRequests = agentRequests.filter(req => req.leave_type === 'Congés payés' && req.status === 'approuve');
                        const usedCADays = caRequests.reduce((sum, req) => sum + req.days_count, 0);
                        const totalCADays = editedAgent.congésAnnuel || 25;
                        const remainingCADays = Math.max(0, totalCADays - usedCADays);
                        
                        return (
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-blue-600">{totalCADays} jours</p>
                            <div className="text-xs text-gray-500">
                              <div>Utilisé: {usedCADays} jours</div>
                              <div>Restant: {remainingCADays} jours</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-green-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Label htmlFor="rttDays">RTT</Label>
                      <Input
                        id="rttDays"
                        type="number"
                        min="0"
                        max="200"
                        value={editedAgent.rttDays || 0}
                        onChange={(e) => setEditedAgent({...editedAgent, rttDays: parseInt(e.target.value) || 0})}
                      />
                      <p className="text-xs text-gray-500 mt-1">heures par an (calculé automatiquement)</p>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-sm font-medium">RTT</span>
                      {(() => {
                        const rttSummary = calculateRTTSummary();
                        return (
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-green-600">{rttSummary.total}h</p>
                            <div className="text-xs text-gray-500">
                              <div>Utilisé: {rttSummary.used}h</div>
                              <div>Restant: {rttSummary.remaining}h</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  {isEditing && (editedAgent.role === 'chef_service' || editedAgent.role === 'medecin') ? (
                    <div className="flex-1">
                      <Label htmlFor="heuresFormation">Heures formation (FORM)</Label>
                      <Input
                        id="heuresFormation"
                        type="number"
                        min="0"
                        max="120"
                        value={editedAgent.heuresFormation || 0}
                        onChange={(e) => setEditedAgent({...editedAgent, heuresFormation: parseInt(e.target.value) || 0})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Calculé automatiquement: {Math.round((editedAgent.weeklyHours || 35) * (3/8))}h (3/8ème des heures hebdomadaires)
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-sm font-medium">Formation</span>
                      <p className="text-lg font-bold text-purple-600">{editedAgent.heuresFormation || 0}h</p>
                      {editedAgent.role !== 'chef_service' && editedAgent.role !== 'medecin' && (
                        <p className="text-xs text-gray-500 mt-1">Non applicable pour ce rôle</p>
                      )}
                      {(editedAgent.role === 'chef_service' || editedAgent.role === 'medecin') && (
                        <p className="text-xs text-gray-500 mt-1">
                          Calculé: {Math.round((editedAgent.weeklyHours || 35) * (3/8))}h (3/8ème des heures)
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-500" />
                  {isEditing ? (
                    <div className="flex-1">
                      <Label htmlFor="enfantMalade">Enfant malade</Label>
                      <Input
                        id="enfantMalade"
                        type="number"
                        min="0"
                        max="20"
                        value={editedAgent.enfantMalade || 3}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 3;
                          console.log('🔄 Modification enfant malade:', newValue);
                          setEditedAgent({...editedAgent, enfantMalade: newValue});
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">jours par enfant par an</p>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-sm font-medium">Enfant malade</span>
                      <p className="text-lg font-bold text-red-600">{editedAgent.enfantMalade || 3} jours</p>
                    </div>
                  )}
                </div>
              </div>
              
              {!isEditing && (
                <div className="pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    <p>• CA: Congés payés annuels</p>
                    <p>• RTT: Calculés selon les heures hebdomadaires</p>
                    <p>• FORM: Heures de formation (médecins et chefs de service - 3/8ème des heures)</p>
                    <p>• Enfant malade: Par enfant de moins de 16 ans</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
                  <div className="text-sm text-gray-600">Demandes totales</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
                  <div className="text-sm text-gray-600">Approuvées</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
                  <div className="text-sm text-gray-600">En attente</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</div>
                  <div className="text-sm text-gray-600">Refusées</div>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Congés utilisés</span>
                  <span className="font-semibold">{stats.totalDaysUsed} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Congés en attente</span>
                  <span className="font-semibold">{stats.totalDaysPending} jours</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Section Planning - Utilisation du composant WeeklySchedule du responsable */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Planning hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklySchedule agents={[agent]} forceViewMode={true} />
          </CardContent>
        </Card>

        {/* Gestion des demandes de congés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mes demandes de congés
              </div>
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvelle demande
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Formulaire de création */}
            {showCreateForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Créer une nouvelle demande</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leave_type">Type de congé</Label>
                    <Select
                      value={newRequest.leave_type}
                      onValueChange={(value) => setNewRequest({...newRequest, leave_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
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
                  <div>
                    <Label htmlFor="reason">Motif (optionnel)</Label>
                    <Input
                      id="reason"
                      value={newRequest.reason}
                      onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                      placeholder="Raison de la demande"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateRequest}>
                    Créer la demande
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Liste des demandes */}
            <div className="space-y-4">
              {agentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Aucune demande de congé</p>
                  <p className="text-sm">Cliquez sur "Nouvelle demande" pour en créer une</p>
                </div>
              ) : (
                agentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getRequestStatusIcon(request.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{request.leave_type}</h3>
                        <p className="text-sm text-gray-600">
                          Du {new Date(request.start_date).toLocaleDateString('fr-FR')} au {new Date(request.end_date).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-500">{request.reason}</p>
                        <p className="text-xs text-gray-400">
                          Créée le {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getRequestStatusColor(request.status)}>
                        {request.status === 'approuve' ? 'Approuvé' : 
                         request.status === 'refuse' ? 'Refusé' : 'En attente'}
                      </Badge>
                      <span className="text-sm font-medium">{request.days_count} jour{request.days_count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
