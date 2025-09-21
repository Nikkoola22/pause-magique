import { useState, useEffect } from "react";
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
  Baby
} from "lucide-react";
import ReadOnlySchedule from "./ReadOnlySchedule";

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

interface AgentProfileProps {
  agent: Agent;
  onClose: () => void;
}

const AgentProfile = ({ agent, onClose }: AgentProfileProps) => {
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
    const agentRequests = getAgentRequests(agent);
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

  const [savedSchedules, setSavedSchedules] = useState<{[key: string]: any[]}>({});
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<any[]>([]);
  const [currentWeekKey, setCurrentWeekKey] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedAgent, setEditedAgent] = useState({
    ...agent,
    weeklyHours: agent.weeklyHours || 35,
    rttDays: agent.rttDays || 0,
    congésAnnuel: agent.congésAnnuel || 25,
    heuresFormation: agent.heuresFormation || calculateFormationHours(agent.weeklyHours || 35, agent.role),
    enfantMalade: agent.enfantMalade || 3
  });
  const [saving, setSaving] = useState(false);

  // Mettre à jour editedAgent quand agent change
  useEffect(() => {
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
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: editedAgent.name,
          email: editedAgent.email,
          phone: editedAgent.phone,
          role: editedAgent.role,
          service: editedAgent.service,
          hire_date: editedAgent.hireDate
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
      if (agent && agent.id === editedAgent.id) {
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
  const getAgentRequests = (agent: Agent): LeaveRequest[] => {
    // Retourner un tableau vide - les demandes viendront uniquement de localStorage
    return [];
  };

  const agentRequests = getAgentRequests(agent);

  // Charger les plannings sauvegardés
  useEffect(() => {
    const loadAgentPlanning = () => {
      const saved = localStorage.getItem('savedSchedules');
      
      if (saved) {
        try {
          const schedules = JSON.parse(saved);
          setSavedSchedules(schedules);
          
          // Chercher le planning de la semaine actuelle pour cet agent
          const currentWeek = new Date();
          const currentWeekKey = getScheduleKey(agent.id, currentWeek);
          
          // Chercher TOUS les plannings pour cet agent
          const agentKeys = Object.keys(schedules).filter(key => key.includes(agent.id));
          
          // Chercher d'abord le planning de la semaine actuelle
          if (schedules[currentWeekKey]) {
            const currentWeekSchedule = schedules[currentWeekKey];
            setCurrentWeekSchedule(currentWeekSchedule);
            setCurrentWeekKey(currentWeekKey);
          } else {
            // Pas de planning pour la semaine actuelle
            setCurrentWeekSchedule([]);
            setCurrentWeekKey(currentWeekKey); // Garder la clé de la semaine actuelle
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement des plannings:', error);
        }
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
  }, [agent.id]);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Fiche Agent</h1>
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
                    {(isEditing ? editedAgent.name : agent.name).split(' ').map(n => n[0]).join('')}
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
                          En poste depuis {editedAgent.hireDate || 'Janvier 2023'}
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
                {agent.name === 'Sophie Bernard' && (
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
                  {isEditing && (agent.role === 'chef_service' || agent.role === 'medecin') ? (
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
                      {agent.role !== 'chef_service' && agent.role !== 'medecin' && (
                        <p className="text-xs text-gray-500 mt-1">Non applicable pour ce rôle</p>
                      )}
                      {(agent.role === 'chef_service' || agent.role === 'medecin') && (
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

        {/* Section Planning - Nouvelle section séparée */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Planning hebdomadaire
              {currentWeekSchedule.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                  En cours
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            
            {currentWeekSchedule.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-green-600 mb-2">
                  ✅ Planning trouvé ({currentWeekSchedule.length} créneaux)
                </div>
                
                  {/* Affichage détaillé du planning */}
                  <ReadOnlySchedule
                    agentName={agent.name}
                    weekLabel={currentWeekKey ? `Semaine du ${currentWeekKey.split('_')[1]}` : "Planning hebdomadaire"}
                    schedule={currentWeekSchedule}
                    isConfirmed={true}
                  />
                
                {/* Navigation entre les semaines */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const agentKeys = Object.keys(savedSchedules).filter(k => k.includes(agent.id)).sort();
                        const currentIndex = agentKeys.indexOf(currentWeekKey);
                        
                        if (currentIndex > 0) {
                          const previousKey = agentKeys[currentIndex - 1];
                          const previousPlanning = savedSchedules[previousKey];
                          setCurrentWeekSchedule(previousPlanning);
                          setCurrentWeekKey(previousKey);
                        }
                      }}
                      disabled={currentWeekKey === '' || !Object.keys(savedSchedules).filter(k => k.includes(agent.id)).includes(currentWeekKey) || Object.keys(savedSchedules).filter(k => k.includes(agent.id)).indexOf(currentWeekKey) === 0}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-blue-800">
                        Navigation des plannings
                      </h4>
                      <p className="text-xs text-blue-600">
                        {Object.keys(savedSchedules).filter(k => k.includes(agent.id)).length} plannings disponibles
                      </p>
                      {currentWeekKey && (
                        <p className="text-xs text-gray-600 mt-1">
                          Semaine: {currentWeekKey.split('_')[1]}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const agentKeys = Object.keys(savedSchedules).filter(k => k.includes(agent.id)).sort();
                        const currentIndex = agentKeys.indexOf(currentWeekKey);
                        
                        if (currentIndex < agentKeys.length - 1) {
                          const nextKey = agentKeys[currentIndex + 1];
                          const nextPlanning = savedSchedules[nextKey];
                          setCurrentWeekSchedule(nextPlanning);
                          setCurrentWeekKey(nextKey);
                        }
                      }}
                      disabled={currentWeekKey === '' || !Object.keys(savedSchedules).filter(k => k.includes(agent.id)).includes(currentWeekKey) || Object.keys(savedSchedules).filter(k => k.includes(agent.id)).indexOf(currentWeekKey) === Object.keys(savedSchedules).filter(k => k.includes(agent.id)).length - 1}
                      className="flex items-center gap-2"
                    >
                      Suivant
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-semibold">Aucun planning pour la semaine actuelle</p>
                <p className="text-xs mt-2">
                  Semaine du {currentWeekKey ? currentWeekKey.split('_')[1] : 'en cours'}
                </p>
                <p className="text-xs mt-1 text-blue-600">
                  {Object.keys(savedSchedules).filter(k => k.includes(agent.id)).length} plannings disponibles pour d'autres semaines
                </p>
                <p className="text-xs mt-1 text-orange-600">
                  Le responsable doit créer un planning pour cette semaine
                </p>
                <div className="mt-3 flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const agentKeys = Object.keys(savedSchedules).filter(k => k.includes(agent.id));
                      if (agentKeys.length > 0) {
                        const mostRecentKey = agentKeys.sort().reverse()[0];
                        const mostRecentPlanning = savedSchedules[mostRecentKey];
                        setCurrentWeekSchedule(mostRecentPlanning);
                        setCurrentWeekKey(mostRecentKey);
                      }
                    }}
                    className="text-xs"
                  >
                    Plus récent
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const agentKeys = Object.keys(savedSchedules).filter(k => k.includes(agent.id));
                      if (agentKeys.length > 0) {
                        const oldestKey = agentKeys.sort()[0];
                        const oldestPlanning = savedSchedules[oldestKey];
                        setCurrentWeekSchedule(oldestPlanning);
                        setCurrentWeekKey(oldestKey);
                      }
                    }}
                    className="text-xs"
                  >
                    Plus ancien
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historique des demandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historique des demandes de congés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentRequests.map((request) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentProfile;
