import { useState, useEffect } from "react";
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

  // Charger TOUS les plannings disponibles avec migration automatique
  useEffect(() => {
    const loadAllPlannings = () => {
      // Essayer d'abord weeklySchedules
      let localData = localStorage.getItem('weeklySchedules');
      
      // Si weeklySchedules est vide ou n'existe pas, essayer savedSchedules et migrer
      if (!localData || localData === '{}') {
        const oldData = localStorage.getItem('savedSchedules');
        if (oldData && oldData !== '{}') {
          console.log('🔄 Migration automatique des plannings...');
          try {
            const oldParsed = JSON.parse(oldData);
            // Sauvegarder dans weeklySchedules
            localStorage.setItem('weeklySchedules', JSON.stringify(oldParsed));
            localData = JSON.stringify(oldParsed);
            console.log('✅ Migration terminée');
          } catch (error) {
            console.error('❌ Erreur migration:', error);
          }
        }
      }
      
      if (localData && localData !== '{}') {
        try {
          const parsed = JSON.parse(localData);
          setSavedSchedules(parsed);
          
          // Charger TOUS les plannings disponibles pour cet agent
          if (agent?.id) {
            const agentKeys = Object.keys(parsed).filter(k => k.includes(agent.id)).sort();
            
            if (agentKeys.length > 0) {
              // Charger le planning le plus récent par défaut
              const mostRecentKey = agentKeys[agentKeys.length - 1];
              const mostRecentPlanning = parsed[mostRecentKey];
              setCurrentWeekSchedule(mostRecentPlanning);
              setCurrentWeekKey(mostRecentKey);
              console.log(`✅ Planning chargé: ${agentKeys.length} plannings disponibles`);
            } else {
              setCurrentWeekSchedule([]);
              setCurrentWeekKey('');
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement des plannings:', error);
        }
      }
    };

    loadAllPlannings();

    // Écouter les événements de mise à jour
    const handlePlanningUpdate = () => {
      loadAllPlannings();
    };

    window.addEventListener('planningUpdated', handlePlanningUpdate);
    return () => window.removeEventListener('planningUpdated', handlePlanningUpdate);
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
            {Object.keys(savedSchedules).filter(k => k.includes(agent.id)).length} plannings disponibles
          </p>
          {currentWeekKey && (
            <p className="text-xs text-gray-500 mt-1">
              Planning actuellement affiché: {currentWeekKey.split('_')[1]}
            </p>
          )}
          
        </div>


        {/* Navigation simple entre les semaines */}
        {Object.keys(savedSchedules).filter(k => k.includes(agent.id)).length > 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const agentKeys = Object.keys(savedSchedules).filter(k => k.includes(agent.id)).sort();
                  const currentIndex = agentKeys.indexOf(currentWeekKey);
                  if (currentIndex > 0) {
                    const previousKey = agentKeys[currentIndex - 1];
                    setCurrentWeekSchedule(savedSchedules[previousKey]);
                    setCurrentWeekKey(previousKey);
                  }
                }}
                disabled={Object.keys(savedSchedules).filter(k => k.includes(agent.id)).indexOf(currentWeekKey) === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <div className="text-center">
                <p className="text-sm font-semibold text-blue-800">
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
                    setCurrentWeekSchedule(savedSchedules[nextKey]);
                    setCurrentWeekKey(nextKey);
                  }
                }}
                disabled={Object.keys(savedSchedules).filter(k => k.includes(agent.id)).indexOf(currentWeekKey) === Object.keys(savedSchedules).filter(k => k.includes(agent.id)).length - 1}
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
