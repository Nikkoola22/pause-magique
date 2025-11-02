import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import ReadOnlySchedule from "@/components/ReadOnlySchedule";
import { Card, CardContent } from "@/components/ui/card";

interface Agent {
  id: string;
  name: string;
}

interface AgentScheduleSectionProps {
  agent: Agent;
}

const AgentScheduleSection = ({ agent }: AgentScheduleSectionProps) => {
  const [savedSchedules, setSavedSchedules] = useState<{[key: string]: any[]}>({});
  const [currentWeekSchedule, setCurrentWeekSchedule] = useState<any[]>([]);
  const [currentWeekKey, setCurrentWeekKey] = useState<string>('');
  const agentScheduleKeys = useMemo(() => {
    if (!agent?.id) return [] as string[];
    const keys = Object.keys(savedSchedules || {});
    const strictMatches = keys.filter(key => key.startsWith(`${agent.id}_`));
    if (strictMatches.length > 0) return strictMatches.sort();
    return keys
      .filter(key => key.split('_')[0] === agent.id || key.includes(agent.id))
      .sort();
  }, [savedSchedules, agent?.id]);
  const agentScheduleCount = agentScheduleKeys.length;
  const currentScheduleIndex = agentScheduleKeys.indexOf(currentWeekKey);

  // Fonction pour générer la clé de planning
  const getScheduleKey = (agentId: string, date: Date) => {
    const weekStart = new Date(date);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + daysToMonday);
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    return `${agentId}_${year}-${month}-${day}`;
  };

  // Charger TOUS les plannings disponibles avec migration automatique et synchronisation améliorée
  useEffect(() => {
    const loadAllPlannings = () => {
      console.log('🔄 Chargement des plannings pour l\'agent:', agent?.id);
      
      // Fusionner tous les plannings disponibles
      const savedSchedulesData = JSON.parse(localStorage.getItem('savedSchedules') || '{}');
      const weeklySchedulesData = JSON.parse(localStorage.getItem('weeklySchedules') || '{}');
      
      // Fusionner les deux sources de données
      const allPlannings = { ...savedSchedulesData, ...weeklySchedulesData };
      
      // Sauvegarder la version fusionnée dans weeklySchedules
      if (Object.keys(allPlannings).length > 0) {
        localStorage.setItem('weeklySchedules', JSON.stringify(allPlannings));
        console.log('✅ Plannings fusionnés et sauvegardés');
      }
      
      setSavedSchedules(allPlannings);
      
      // Charger TOUS les plannings disponibles pour cet agent avec recherche étendue
      if (agent?.id) {
        console.log('🔍 Recherche des plannings pour l\'agent:', agent.id);
        
        // Recherche étendue : chercher par ID exact, par début d'ID, par correspondance partielle, par nom, et par username
        const agentKeys = Object.keys(allPlannings).filter(key => {
          const keyAgentId = key.split('_')[0];
          // Chercher par ID, nom, ou username de l'agent
          return keyAgentId === agent.id || 
                 key.startsWith(agent.id + '_') || 
                 key.includes(agent.id) ||
                 keyAgentId === agent.name ||
                 key.startsWith(agent.name + '_') ||
                 key.includes(agent.name) ||
                 keyAgentId === (agent as any).username ||
                 key.startsWith(((agent as any).username || '') + '_') ||
                 key.includes((agent as any).username || '');
        }).sort();
        
        console.log('📊 Clés trouvées:', agentKeys);
        
        if (agentKeys.length > 0) {
          // Trouver la semaine courante (lundi de la semaine actuelle)
          const today = new Date();
          const dayOfWeek = today.getDay();
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          const mondayOfCurrentWeek = new Date(today);
          mondayOfCurrentWeek.setDate(mondayOfCurrentWeek.getDate() + daysToMonday);
          
          const year = mondayOfCurrentWeek.getFullYear();
          const month = String(mondayOfCurrentWeek.getMonth() + 1).padStart(2, '0');
          const day = String(mondayOfCurrentWeek.getDate()).padStart(2, '0');
          const currentWeekDateStr = `${year}-${month}-${day}`;
          
          // Chercher une clé qui contient la date de la semaine courante
          let planningToLoad = agentKeys.find(key => key.includes(currentWeekDateStr));
          
          // Si la semaine courante n'existe pas, charger le plus récent
          if (!planningToLoad) {
            console.log(`⚠️ Planning de la semaine courante (${currentWeekDateStr}) non trouvé, utilisation du plus récent`);
            planningToLoad = agentKeys[agentKeys.length - 1];
          }
          
          const selectedPlanning = allPlannings[planningToLoad];
          setCurrentWeekSchedule(selectedPlanning);
          setCurrentWeekKey(planningToLoad);
          console.log(`✅ Planning chargé: ${agentKeys.length} plannings disponibles`);
          console.log(`📅 Semaine courante: ${currentWeekDateStr}`);
          console.log(`📅 Planning actuel: ${planningToLoad} (${selectedPlanning?.length || 0} créneaux)`);
          
          // Déclencher un événement pour notifier que les plannings sont disponibles
          window.dispatchEvent(new CustomEvent('agentPlanningsLoaded', { 
            detail: { agentId: agent.id, count: agentKeys.length, keys: agentKeys } 
          }));
        } else {
          setCurrentWeekSchedule([]);
          setCurrentWeekKey('');
          console.log('❌ Aucun planning trouvé pour cet agent');
          
          // Déclencher un événement pour notifier qu'aucun planning n'est disponible
          window.dispatchEvent(new CustomEvent('agentPlanningsNotFound', { 
            detail: { agentId: agent.id } 
          }));
        }
      }
    };

    loadAllPlannings();

    // Écouter les événements de mise à jour
    const handlePlanningUpdate = () => {
      console.log('🔄 Événement de mise à jour reçu, rechargement des plannings...');
      loadAllPlannings();
    };

    const handlePlanningsUpdated = () => {
      console.log('🔄 Événement planningsUpdated reçu, rechargement des plannings...');
      loadAllPlannings();
    };

    window.addEventListener('planningUpdated', handlePlanningUpdate);
    window.addEventListener('planningsUpdated', handlePlanningsUpdated);
    window.addEventListener('planningsUpdatedWithLeave', handlePlanningUpdate);
    window.addEventListener('agentPlanningsLoaded', handlePlanningUpdate);
    window.addEventListener('agentPlanningsNotFound', handlePlanningUpdate);
    
    return () => {
      window.removeEventListener('planningUpdated', handlePlanningUpdate);
      window.removeEventListener('planningsUpdated', handlePlanningsUpdated);
      window.removeEventListener('planningsUpdatedWithLeave', handlePlanningUpdate);
      window.removeEventListener('agentPlanningsLoaded', handlePlanningUpdate);
      window.removeEventListener('agentPlanningsNotFound', handlePlanningUpdate);
    };
  }, [agent?.id]);

  if (!agent?.id) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Agent non trouvé</p>
        <p className="text-xs mt-2">Agent: {JSON.stringify(agent)}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        
        {/* Affichage du planning - TOUJOURS VISIBLE */}
        <ReadOnlySchedule
          agentName={agent.name || 'Agent'}
          weekLabel={currentWeekKey ? `Semaine du ${currentWeekKey.split('_')[1]}` : "Planning hebdomadaire"}
          schedule={currentWeekSchedule}
          isConfirmed={true}
        />
        
        {/* Informations sur les plannings disponibles */}
        <div className="text-center py-2">
          <p className="text-sm text-blue-600">
            {agentScheduleCount} plannings disponibles
          </p>
          {currentWeekKey && (
            <p className="text-xs text-gray-500 mt-1">
              Planning actuellement affiché: {currentWeekKey.split('_')[1]}
            </p>
          )}
          
        </div>


        {/* Navigation simple entre les semaines */}
        {agentScheduleCount > 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (currentScheduleIndex > 0) {
                    const previousKey = agentScheduleKeys[currentScheduleIndex - 1];
                    setCurrentWeekSchedule(savedSchedules[previousKey]);
                    setCurrentWeekKey(previousKey);
                  }
                }}
                disabled={currentScheduleIndex <= 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="text-center">
                <p className="text-sm font-semibold text-blue-800">
                  {agentScheduleCount} plannings disponibles
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
                  if (currentScheduleIndex > -1 && currentScheduleIndex < agentScheduleKeys.length - 1) {
                    const nextKey = agentScheduleKeys[currentScheduleIndex + 1];
                    setCurrentWeekSchedule(savedSchedules[nextKey]);
                    setCurrentWeekKey(nextKey);
                  }
                }}
                disabled={currentScheduleIndex === -1 || currentScheduleIndex >= agentScheduleKeys.length - 1}
                className="flex items-center gap-2"
              >
                Suivant
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentScheduleSection;
