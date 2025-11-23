import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Users, Save, Eye, Repeat } from "lucide-react";
import CalendarPicker from "./CalendarPicker";
import ReadOnlySchedule from "./ReadOnlySchedule";
import { saveAgentPlanning, getAllAgentPlannings } from "../lib/agentPlanningApi";

interface ScheduleSlot {
  day: string;
  time: string;
  status: 'working' | 'break' | 'off';
  notes?: string;
  startTime?: string;
  endTime?: string;
}

interface Agent {
  id: string;
  name: string;
  service: string;
  role?: string;
}

interface WeeklyScheduleProps {
  agents: Agent[];
  forceViewMode?: boolean;
}

const generateTimeSlots = () => {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const timeSlots = [];
  
  for (const day of days) {
    // Lundi à Vendredi : Matin, Midi, Après-midi
    if (day !== 'Samedi') {
      timeSlots.push(
        { day, time: 'Matin', status: 'working' as const, startTime: '08:00', endTime: '12:00' },
        { day, time: 'Midi', status: 'break' as const, startTime: '12:00', endTime: '13:00' },
        { day, time: 'Après-midi', status: 'working' as const, startTime: '13:00', endTime: '17:00' }
      );
    } else {
      // Samedi : Matin seulement
      timeSlots.push(
        { day, time: 'Matin', status: 'working' as const, startTime: '08:00', endTime: '13:00' }
      );
    }
  }
  
  return timeSlots;
};

const WeeklySchedule = ({ agents, forceViewMode = false }: WeeklyScheduleProps) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(generateTimeSlots());
  const [savedSchedules, setSavedSchedules] = useState<{[key: string]: ScheduleSlot[]}>({});
  const [viewMode, setViewMode] = useState<'edit' | 'view'>(forceViewMode ? 'view' : 'edit');
  const [editingTimeSlot, setEditingTimeSlot] = useState<{day: string, time: string} | null>(null);
  const [repeatWeekly, setRepeatWeekly] = useState<boolean>(false);

  // Structure des créneaux par jour
  const getTimeSlotsForDay = (day: string) => {
    if (day !== 'Samedi') {
      const matinSlot = schedule.find(s => s.day === day && s.time === 'Matin');
      const midiSlot = schedule.find(s => s.day === day && s.time === 'Midi');
      const apresMidiSlot = schedule.find(s => s.day === day && s.time === 'Après-midi');
      
      return [
        { 
          time: 'Matin', 
          status: matinSlot?.status || 'working', 
          startTime: matinSlot?.startTime || '08:00', 
          endTime: matinSlot?.endTime || '12:00' 
        },
        { 
          time: 'Midi', 
          status: midiSlot?.status || 'break', 
          startTime: midiSlot?.startTime || '12:00', 
          endTime: midiSlot?.endTime || '13:00' 
        },
        { 
          time: 'Après-midi', 
          status: apresMidiSlot?.status || 'working', 
          startTime: apresMidiSlot?.startTime || '13:00', 
          endTime: apresMidiSlot?.endTime || '17:00' 
        }
      ];
    } else {
      const matinSlot = schedule.find(s => s.day === day && s.time === 'Matin');
      return [
        { 
          time: 'Matin', 
          status: matinSlot?.status || 'working', 
          startTime: matinSlot?.startTime || '08:00', 
          endTime: matinSlot?.endTime || '13:00' 
        }
      ];
    }
  };

  const updateScheduleSlot = (day: string, time: string, status: 'working' | 'break' | 'off') => {
    const newSchedule = schedule.map(slot => 
      slot.day === day && slot.time === time 
        ? { ...slot, status }
        : slot
    );
    setSchedule(newSchedule);
  };

  const updateTimeSlotHours = (day: string, time: string, startTime: string, endTime: string) => {
    console.log('🔄 updateTimeSlotHours appelée:', { day, time, startTime, endTime });
    
    // Si day est vide, on met à jour tous les créneaux de ce type
    if (!day) {
      console.log('📝 Mise à jour globale pour le créneau:', time);
      const newSchedule = schedule.map(slot => 
        slot.time === time 
          ? { ...slot, startTime, endTime }
          : slot
      );
      console.log('✅ Nouveau schedule:', newSchedule);
      setSchedule(newSchedule);
    } else {
      console.log('📝 Mise à jour spécifique pour:', day, time);
      // Sinon, on met à jour seulement le créneau spécifique
      const newSchedule = schedule.map(slot => 
        slot.day === day && slot.time === time 
          ? { ...slot, startTime, endTime }
          : slot
      );
      console.log('✅ Nouveau schedule:', newSchedule);
      setSchedule(newSchedule);
    }
    setEditingTimeSlot(null);
  };

  // Génération de clé unique pour agent + semaine
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
    
    console.log('🔑 WeeklySchedule - Génération clé:');
    console.log('  - Date d\'entrée:', date.toLocaleDateString());
    console.log('  - Jour de la semaine:', dayOfWeek);
    console.log('  - Lundi calculé:', weekStart.toLocaleDateString());
    console.log('  - Clé générée:', key);
    
    return key;
  };

  // Vérifier si un planning existe déjà pour cette semaine
  const getExistingSchedule = (agentId: string, date: Date) => {
    const key = getScheduleKey(agentId, date);
    console.log('🔍 RECHERCHE PLANNING EXISTANT');
    console.log('🔑 Clé recherchée:', key);
    console.log('📊 Plannings disponibles:', Object.keys(savedSchedules));
    
    const found = savedSchedules[key];
    if (found) {
      console.log('✅ Planning trouvé:', found.length, 'créneaux');
    } else {
      console.log('❌ Planning NON trouvé pour la clé:', key);
      // Chercher des clés similaires pour debug
      const similarKeys = Object.keys(savedSchedules).filter(k => k.includes(agentId));
      console.log('🔍 Clés similaires trouvées:', similarKeys);
    }
    
    return found || null;
  };

  // NOUVELLE FONCTION SIMPLIFIÉE POUR VÉRIFIER LA RÉPÉTITION
  const isPlanningRepeated = (agentId: string) => {
    if (!agentId) return false;
    
    // Vérifier l'année 2025 spécifiquement
    const targetYear = 2025;
    const startOfYear = new Date(targetYear, 0, 1);
    const currentWeekStart = new Date(selectedDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - (currentWeekStart.getDay() === 0 ? 6 : currentWeekStart.getDay() - 1));
    let weeksUpdated = 0;
    
    // Vérifier les 52 semaines de 2025
    for (let week = 0; week < 52; week++) {
      const weekDate = new Date(startOfYear);
      weekDate.setDate(startOfYear.getDate() + (week * 7));
      const key = getScheduleKey(agentId, weekDate);
      
      if (savedSchedules[key]) {
        weeksUpdated++;
      }
    }
    
    // Si plus de 40 semaines ont ce planning, on considère qu'il est répété
    return weeksUpdated >= 40;
  };

  // NOUVELLE FONCTION POUR CHARGER UN PLANNING EXISTANT
  const loadExistingPlanning = () => {
    if (!selectedAgent) return;
    
    console.log('🔄 CHARGEMENT D\'UN PLANNING EXISTANT');
    
    // Chercher n'importe quel planning existant pour cet agent
    const agentKeys = Object.keys(savedSchedules).filter(key => key.includes(selectedAgent));
    
    if (agentKeys.length > 0) {
      // Prendre le premier planning trouvé
      const firstKey = agentKeys[0];
      const existingPlanning = savedSchedules[firstKey];
      
      if (existingPlanning && existingPlanning.length > 0) {
        console.log('✅ Planning existant trouvé:', firstKey);
        setSchedule(existingPlanning);
        setViewMode('view');
        
        // Extraire la date du planning trouvé
        const datePart = firstKey.split('_')[1];
        const planningDate = new Date(datePart + 'T00:00:00');
        setSelectedDate(planningDate);
        
        alert('Planning existant chargé !');
        return;
      }
    }
    
    console.log('❌ Aucun planning existant trouvé');
    alert('Aucun planning existant trouvé pour cet agent');
  };

  // Charger un planning existant ou initialiser un nouveau
  const loadSchedule = (agentId: string, date: Date, forceMode?: 'edit' | 'view') => {
    console.log('🔄 CHARGEMENT DU PLANNING');
    console.log('👤 Agent:', agentId);
    console.log('📅 Date:', date.toLocaleDateString());
    console.log('📊 Plannings sauvegardés disponibles:', Object.keys(savedSchedules).length);
    
    const existingSchedule = getExistingSchedule(agentId, date);
    console.log('🔍 Recherche planning existant...');
    console.log('📂 Planning trouvé:', existingSchedule ? existingSchedule.length + ' créneaux' : 'AUCUN');
    
    if (existingSchedule) {
      console.log('✅ CHARGEMENT PLANNING EXISTANT');
      console.log('📋 Contenu:', existingSchedule);
      setSchedule(existingSchedule);
      // Ne changer le mode que si on n'a pas forcé un mode spécifique
      if (!forceMode) {
        setViewMode('view');
        console.log('✅ Mode: VIEW (planning existant chargé)');
      } else {
        console.log('✅ Mode forcé:', forceMode);
      }
    } else {
      console.log('🆕 CRÉATION NOUVEAU PLANNING');
      const newSchedule = generateTimeSlots();
      console.log('🆕 Nouveau planning généré:', newSchedule.length, 'créneaux');
      console.log('📋 Contenu:', newSchedule);
      setSchedule(newSchedule);
      // Ne changer le mode que si on n'a pas forcé un mode spécifique
      if (!forceMode) {
        setViewMode('edit');
        console.log('✅ Mode: EDIT (nouveau planning)');
      } else {
        console.log('✅ Mode forcé:', forceMode);
      }
    }
  };

  // Auto-select agent if only one is provided
  useEffect(() => {
    if (agents.length === 1 && !selectedAgent) {
      setSelectedAgent(agents[0].id);
    }
  }, [agents]);

  // Load from Supabase when agent changes
  useEffect(() => {
    const fetchSupabasePlannings = async () => {
      if (!selectedAgent) return;
      
      console.log('🔄 Chargement des plannings Supabase pour:', selectedAgent);
      try {
        const { data, error } = await getAllAgentPlannings(selectedAgent);
        
        if (error) {
          console.error('❌ Erreur chargement Supabase:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`✅ ${data.length} plannings chargés depuis Supabase`);
          
          setSavedSchedules(prev => {
            const newSchedules = { ...prev };
            data.forEach((item: any) => {
              if (item.week && item.planning) {
                newSchedules[item.week] = item.planning;
              }
            });
            return newSchedules;
          });
          
          // Force reload of current view if needed
          if (selectedDate) {
             // Trigger a re-render or re-evaluation of getExistingSchedule
             // But since savedSchedules changes, the other useEffect dependent on it will fire?
             // Yes: useEffect(() => { ... loadSchedule ... }, [..., savedSchedules])
          }
        }
      } catch (err) {
        console.error('❌ Exception chargement Supabase:', err);
      }
    };

    fetchSupabasePlannings();
  }, [selectedAgent]);

  // Gestion du changement d'agent ou de date
  useEffect(() => {
    if (selectedAgent) {
      console.log('🔄 useEffect déclenché - Chargement planning pour:', selectedAgent, selectedDate.toLocaleDateString());
      loadSchedule(selectedAgent, selectedDate);
    }
  }, [selectedAgent, selectedDate, savedSchedules]);

  // Initialiser avec la semaine actuelle quand un agent est sélectionné
  useEffect(() => {
    if (selectedAgent && !selectedDate) {
      console.log('🔄 Initialisation avec la semaine actuelle');
      setSelectedDate(new Date());
    }
  }, [selectedAgent]);




  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800 border-green-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'working': return 'Présent';
      case 'break': return 'Pause';
      case 'off': return 'Absent';
      default: return 'Non défini';
    }
  };

  const handleSaveSchedule = () => {
    if (!selectedAgent) {
      alert('Veuillez sélectionner un agent');
      return;
    }
    console.log('🚀 DEBUT handleSaveSchedule');
    console.log('📋 Données de sauvegarde:', {
      agentId: selectedAgent,
      schedule: schedule,
      scheduleLength: schedule.length,
      repeatWeekly: repeatWeekly,
      selectedDate: selectedDate
    });
    const newSavedSchedules = { ...savedSchedules };
    const supabaseSync = async () => {
      try {
        if (repeatWeekly) {
          const targetYear = 2025;
          const startOfYear = new Date(targetYear, 0, 1);
          const currentWeekStart = new Date(selectedDate);
          currentWeekStart.setDate(currentWeekStart.getDate() - (currentWeekStart.getDay() === 0 ? 6 : currentWeekStart.getDay() - 1));
          let weeksUpdated = 0;
          for (let week = 0; week < 52; week++) {
            const weekDate = new Date(startOfYear);
            weekDate.setDate(startOfYear.getDate() + (week * 7));
            if (weekDate >= currentWeekStart) {
              const key = getScheduleKey(selectedAgent, weekDate);
              newSavedSchedules[key] = [...schedule];
              weeksUpdated++;
              await saveAgentPlanning(selectedAgent, key, schedule);
              if (weeksUpdated <= 5) {
                console.log(`📅 Semaine ${week + 1} 2025 (FUTURE): ${key}`);
              }
            }
          }
          console.log(`✅ ${weeksUpdated} plannings FUTURS mis à jour pour l'année 2025`);
        } else {
          const key = getScheduleKey(selectedAgent, selectedDate);
          newSavedSchedules[key] = [...schedule];
          console.log('💾 Planning sauvegardé pour cette semaine:', key);
          await saveAgentPlanning(selectedAgent, key, schedule);
        }
        localStorage.setItem('weeklySchedules', JSON.stringify(newSavedSchedules));
        setSavedSchedules(newSavedSchedules);
        setViewMode('view');
        setRepeatWeekly(false);
        window.dispatchEvent(new CustomEvent('planningUpdated', { 
          detail: { agentId: selectedAgent, date: selectedDate, repeatWeekly } 
        }));
        const message = repeatWeekly 
          ? `Planning sauvegardé et appliqué aux semaines futures de l'année 2025 !`
          : 'Planning sauvegardé avec succès !';
        alert(message);
      } catch (error: any) {
        console.error('❌ Erreur lors de la sauvegarde Supabase:', error);
        const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
        alert(`Erreur lors de la sauvegarde du planning:\n${errorMessage}`);
      }
    };
    supabaseSync();
  };

  // Charger les plannings sauvegardés au démarrage
  useEffect(() => {
    const loadSavedSchedules = () => {
      console.log('🚀 Chargement des plannings sauvegardés au démarrage...');
      const saved = localStorage.getItem('weeklySchedules');
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('📊 Plannings trouvés dans localStorage:', Object.keys(parsed).length, 'entrées');
          console.log('📋 Clés des plannings:', Object.keys(parsed));
          setSavedSchedules(parsed);
          console.log('✅ Plannings sauvegardés chargés depuis localStorage');
        } catch (error) {
          console.error('❌ Erreur lors du chargement des plannings sauvegardés:', error);
        }
      } else {
        console.log('📭 Aucun planning sauvegardé trouvé dans localStorage');
      }
    };

    loadSavedSchedules();

    // Écouter les événements de mise à jour
    const handlePlanningUpdate = () => {
      console.log('📢 WeeklySchedule - Événement de mise à jour reçu');
      loadSavedSchedules();
    };

    window.addEventListener('planningUpdated', handlePlanningUpdate);
    
    return () => {
      window.removeEventListener('planningUpdated', handlePlanningUpdate);
    };
  }, []);

  // Fonction pour obtenir le label de la semaine
  const getWeekLabel = (date: Date) => {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 5);
    
    return `Semaine du ${weekStart.toLocaleDateString('fr-FR')} au ${weekEnd.toLocaleDateString('fr-FR')}`;
  };

  // Calculer le nombre d'heures réelles effectuées dans la semaine
  const calculateTotalWorkingHours = () => {
    if (!schedule || schedule.length === 0) return 0;
    
    let totalMinutes = 0;
    
    schedule.forEach(slot => {
      // Ne compter que les créneaux "working" (présent)
      if (slot.status === 'working' && slot.startTime && slot.endTime) {
        const start = slot.startTime.split(':');
        const end = slot.endTime.split(':');
        
        const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
        const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
        
        const durationMinutes = endMinutes - startMinutes;
        totalMinutes += durationMinutes;
      }
    });
    
    // Convertir en heures (arrondi à 0.5h près)
    const totalHours = totalMinutes / 60;
    return Math.round(totalHours * 2) / 2; // Arrondi à 0.5h près
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Planning Hebdomadaire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection de l'agent */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent
          </label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Sélectionner un agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name} - {agent.role || agent.service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calendrier de sélection */}
        {selectedAgent && (
          <div className="mb-6">
            <CalendarPicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>
        )}

        {/* Légende */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-sm">Présent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-sm">Pause</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-sm">Absent</span>
          </div>
        </div>

        {/* Planning */}
        {selectedAgent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  Planning de {agents.find(a => a.id === selectedAgent)?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {calculateTotalWorkingHours()}h effectuées cette semaine
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                     {viewMode === 'view' && (
                       <>
                         <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                           ✓ Planning confirmé
                         </Badge>
                         {isPlanningRepeated(selectedAgent) && (
                           <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                             <Repeat className="h-3 w-3 mr-1" />
                             Répété toutes les semaines
                           </Badge>
                         )}
                         {!forceViewMode && (
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => {
                               console.log('✏️ Modification du planning activée');
                               setViewMode('edit');
                             }}
                             className="ml-2"
                           >
                             <Eye className="h-4 w-4 mr-1" />
                             Modifier Planning
                           </Button>
                         )}
                       </>
                     )}
                {viewMode === 'edit' && !forceViewMode && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      📝 En cours de modification
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        console.log('❌ Annulation des modifications');
                        // Recharger le planning original depuis localStorage
                        const key = getScheduleKey(selectedAgent, selectedDate);
                        const originalPlanning = savedSchedules[key];
                        if (originalPlanning) {
                          setSchedule(originalPlanning);
                          setViewMode('view');
                          console.log('✅ Planning restauré à sa version originale');
                        }
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      ❌ Annuler
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mode d'affichage selon le statut */}
            {viewMode === 'view' ? (
              <ReadOnlySchedule
                agentName={agents.find(a => a.id === selectedAgent)?.name || ''}
                weekLabel={getWeekLabel(selectedDate)}
                schedule={schedule}
                isConfirmed={true}
              />
            ) : (
              <>
                {/* Grille du planning en mode édition */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left font-semibold">Jour</th>
                        <th className="border border-gray-300 p-3 text-center font-semibold">
                          <span>Matin</span>
                        </th>
                        <th className="border border-gray-300 p-3 text-center font-semibold">
                          <span>Midi</span>
                        </th>
                        <th className="border border-gray-300 p-3 text-center font-semibold">
                          <span>Après-midi</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                        const daySlots = getTimeSlotsForDay(day);
                        return (
                          <tr key={day} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-3 font-medium bg-gray-50">
                              {day}
                            </td>
                            {day !== 'Samedi' ? (
                              <>
                                <td className="border border-gray-300 p-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs text-gray-500">
                                        {daySlots[0].startTime}-{daySlots[0].endTime}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0"
                                        onClick={() => setEditingTimeSlot({day: day, time: 'Matin'})}
                                      >
                                        <Clock className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Badge className={`${getStatusColor(daySlots[0].status)} text-xs`}>
                                      {getStatusLabel(daySlots[0].status)}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={daySlots[0].status === 'working' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Matin', 'working')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        P
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[0].status === 'break' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Matin', 'break')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        B
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[0].status === 'off' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Matin', 'off')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        A
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs text-gray-500">
                                        {daySlots[1].startTime}-{daySlots[1].endTime}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0"
                                        onClick={() => setEditingTimeSlot({day: day, time: 'Midi'})}
                                      >
                                        <Clock className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Badge className={`${getStatusColor(daySlots[1].status)} text-xs`}>
                                      {getStatusLabel(daySlots[1].status)}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={daySlots[1].status === 'working' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Midi', 'working')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        P
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[1].status === 'break' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Midi', 'break')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        B
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[1].status === 'off' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Midi', 'off')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        A
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs text-gray-500">
                                        {daySlots[2].startTime}-{daySlots[2].endTime}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0"
                                        onClick={() => setEditingTimeSlot({day: day, time: 'Après-midi'})}
                                      >
                                        <Clock className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Badge className={`${getStatusColor(daySlots[2].status)} text-xs`}>
                                      {getStatusLabel(daySlots[2].status)}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={daySlots[2].status === 'working' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Après-midi', 'working')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        P
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[2].status === 'break' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Après-midi', 'break')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        B
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[2].status === 'off' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Après-midi', 'off')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        A
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="border border-gray-300 p-2 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs text-gray-500">
                                        {daySlots[0].startTime}-{daySlots[0].endTime}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0"
                                        onClick={() => setEditingTimeSlot({day: day, time: 'Matin'})}
                                      >
                                        <Clock className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Badge className={`${getStatusColor(daySlots[0].status)} text-xs`}>
                                      {getStatusLabel(daySlots[0].status)}
                                    </Badge>
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant={daySlots[0].status === 'working' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Matin', 'working')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        P
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[0].status === 'break' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Matin', 'break')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        B
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={daySlots[0].status === 'off' ? 'default' : 'outline'}
                                        onClick={() => updateScheduleSlot(day, 'Matin', 'off')}
                                        className="h-6 w-12 text-xs px-1"
                                      >
                                        A
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2 text-center bg-gray-100">
                                  <span className="text-gray-500 text-sm">-</span>
                                </td>
                                <td className="border border-gray-300 p-2 text-center bg-gray-100">
                                  <span className="text-gray-500 text-sm">-</span>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Options de sauvegarde */}
                <div className="space-y-4">
                  {/* Case à cocher pour répétition hebdomadaire */}
                  <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
                    <Checkbox 
                      id="repeat-weekly" 
                      checked={repeatWeekly}
                      onCheckedChange={(checked) => setRepeatWeekly(checked as boolean)}
                    />
                         <label 
                           htmlFor="repeat-weekly" 
                           className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                         >
                           <div className="flex items-center gap-2">
                             <Repeat className="h-4 w-4 text-blue-600" />
                             <span>Appliquer ce planning aux semaines futures de l'année</span>
                           </div>
                         </label>
                  </div>
                  
                  {/* Bouton de sauvegarde */}
                       <div className="flex justify-center gap-2">
                         <Button onClick={handleSaveSchedule} className="bg-green-600 hover:bg-green-700">
                           <Save className="h-4 w-4 mr-2" />
                           {repeatWeekly ? 'Confirmer et appliquer aux semaines futures' : 'Confirmer et sauvegarder le planning'}
                         </Button>
                         
                         {/* BOUTONS SIMPLIFIÉS */}
                         <Button 
                           variant="outline" 
                           onClick={loadExistingPlanning}
                           className="text-xs"
                         >
                           Charger Planning Existant
                         </Button>
                         
                         <Button 
                           variant="outline" 
                           onClick={() => {
                             if (selectedAgent) {
                               const repeated = isPlanningRepeated(selectedAgent);
                               alert(`Planning répété: ${repeated ? 'OUI' : 'NON'}`);
                             }
                           }}
                           className="text-xs"
                         >
                           Vérifier Répétition
                         </Button>
                         
                         <Button 
                           variant="outline" 
                           onClick={() => {
                             console.log('🗑️ Vérification localStorage...');
                             const saved = localStorage.getItem('weeklySchedules');
                             if (saved) {
                               const parsed = JSON.parse(saved);
                               console.log('📊 localStorage contient:', Object.keys(parsed).length, 'entrées');
                               alert(`localStorage: ${Object.keys(parsed).length} plannings sauvegardés`);
                             } else {
                               alert('localStorage vide');
                             }
                           }}
                           className="text-xs"
                         >
                           Vérif localStorage
                         </Button>
                         
                         <Button 
                           variant="destructive" 
                           onClick={() => {
                             if (confirm('Êtes-vous sûr de vouloir vider tous les plannings sauvegardés ?')) {
                               localStorage.removeItem('weeklySchedules');
                               setSavedSchedules({});
                               console.log('🗑️ localStorage vidé');
                               alert('localStorage vidé');
                             }
                           }}
                           className="text-xs"
                         >
                           Vider localStorage
                         </Button>
                       </div>
                </div>

                {/* Légende des boutons */}
                <div className="flex justify-center gap-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="default" className="h-6 w-12 text-xs px-1">P</Button>
                    <span className="text-sm text-gray-700">Présent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-6 w-12 text-xs px-1">B</Button>
                    <span className="text-sm text-gray-700">Pause</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-6 w-12 text-xs px-1">A</Button>
                    <span className="text-sm text-gray-700">Absent</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal pour modifier les heures */}
        {editingTimeSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Modifier les heures - {editingTimeSlot.time}
                {editingTimeSlot.day && (
                  <span className="text-sm text-gray-600 ml-2">({editingTimeSlot.day})</span>
                )}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    defaultValue={
                      editingTimeSlot.day && editingTimeSlot.time 
                        ? schedule.find(s => s.day === editingTimeSlot.day && s.time === editingTimeSlot.time)?.startTime ||
                          (editingTimeSlot.time === 'Matin' ? '08:00' :
                           editingTimeSlot.time === 'Midi' ? '12:00' :
                           editingTimeSlot.time === 'Après-midi' ? '13:00' : '08:00')
                        : (editingTimeSlot.time === 'Matin' ? '08:00' :
                           editingTimeSlot.time === 'Midi' ? '12:00' :
                           editingTimeSlot.time === 'Après-midi' ? '13:00' : '08:00')
                    }
                    id="startTime"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    defaultValue={
                      editingTimeSlot.day && editingTimeSlot.time 
                        ? schedule.find(s => s.day === editingTimeSlot.day && s.time === editingTimeSlot.time)?.endTime ||
                          (editingTimeSlot.time === 'Matin' ? (editingTimeSlot.day === 'Samedi' ? '13:00' : '12:00') :
                           editingTimeSlot.time === 'Midi' ? '13:00' :
                           editingTimeSlot.time === 'Après-midi' ? '17:00' : '13:00')
                        : (editingTimeSlot.time === 'Matin' ? '12:00' :
                           editingTimeSlot.time === 'Midi' ? '13:00' :
                           editingTimeSlot.time === 'Après-midi' ? '17:00' : '13:00')
                    }
                    id="endTime"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEditingTimeSlot(null)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    const startTime = (document.getElementById('startTime') as HTMLInputElement).value;
                    const endTime = (document.getElementById('endTime') as HTMLInputElement).value;
                    
                    console.log('🕐 Modification des heures:', {
                      day: editingTimeSlot.day,
                      time: editingTimeSlot.time,
                      startTime,
                      endTime,
                      currentSchedule: schedule
                    });
                    
                    updateTimeSlotHours(editingTimeSlot.day, editingTimeSlot.time, startTime, endTime);
                  }}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklySchedule;
