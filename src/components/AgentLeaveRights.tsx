import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Heart,
  Gift
} from "lucide-react";

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  status: 'en_attente' | 'approuve' | 'refuse';
  created_at: string;
  approved_at?: string;
  comments?: string;
}

interface AgentLeaveRightsProps {
  agent: {
    id: string;
    name: string;
    role: string;
    weeklyHours?: number;
    rttDays?: number;
    congésAnnuel?: number;
    heuresFormation?: number;
    enfantMalade?: number;
  };
  leaveRequests?: LeaveRequest[];
  showDetails?: boolean;
}

const AgentLeaveRights: React.FC<AgentLeaveRightsProps> = ({ 
  agent, 
  leaveRequests = [],
  showDetails = true 
}) => {
  // Calculer les heures de formation selon le rôle
  const calculateFormationHours = (weeklyHours: number, role: string) => {
    if (role === 'chef_service' || role === 'medecin') {
      return Math.round(weeklyHours * (3/8)); // 3/8ème des heures hebdomadaires
    }
    return 0;
  };

  // Calculer le résumé RTT
  const calculateRTTSummary = () => {
    const rttRequests = leaveRequests.filter(req => 
      req.leave_type === 'RTT' && req.status === 'approuve'
    );
    const used = rttRequests.reduce((sum, req) => sum + req.days_count, 0);
    const total = agent.rttDays || 0;
    const remaining = Math.max(0, total - used);
    
    return {
      total,
      used,
      remaining
    };
  };

  // Obtenir les demandes de l'agent (filtrage par agent si nécessaire)
  const getAgentRequests = (agentId: string): LeaveRequest[] => {
    // Pour l'instant, retourner toutes les demandes
    // Dans une vraie application, filtrer par agentId
    return leaveRequests;
  };

  const agentRequests = getAgentRequests(agent.id);
  const rttSummary = calculateRTTSummary();
  const formationHours = agent.heuresFormation || calculateFormationHours(agent.weeklyHours || 35, agent.role);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Droits de congés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Congés annuels */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div className="flex-1">
              <span className="text-sm font-medium">Congés annuels</span>
              {showDetails && (() => {
                const caRequests = agentRequests.filter(req => 
                  req.leave_type === 'Congés payés' && req.status === 'approuve'
                );
                const usedCADays = caRequests.reduce((sum, req) => sum + req.days_count, 0);
                const totalCADays = agent.congésAnnuel || 25;
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
              {!showDetails && (
                <p className="text-lg font-bold text-blue-600">{agent.congésAnnuel || 25} jours</p>
              )}
            </div>
          </div>
          
          {/* RTT */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-green-500" />
            <div className="flex-1">
              <span className="text-sm font-medium">RTT</span>
              {showDetails && (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-green-600">{rttSummary.total}h</p>
                  <div className="text-xs text-gray-500">
                    <div>Utilisé: {rttSummary.used}h</div>
                    <div>Restant: {rttSummary.remaining}h</div>
                  </div>
                </div>
              )}
              {!showDetails && (
                <p className="text-lg font-bold text-green-600">{agent.rttDays || 0}h</p>
              )}
            </div>
          </div>
          
          {/* Formation */}
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-purple-500" />
            <div className="flex-1">
              <span className="text-sm font-medium">Formation</span>
              <p className="text-lg font-bold text-purple-600">{formationHours}h</p>
              {agent.role !== 'chef_service' && agent.role !== 'medecin' && (
                <p className="text-xs text-gray-500 mt-1">Non applicable pour ce rôle</p>
              )}
              {(agent.role === 'chef_service' || agent.role === 'medecin') && (
                <p className="text-xs text-gray-500 mt-1">
                  Calculé: {Math.round((agent.weeklyHours || 35) * (3/8))}h (3/8ème des heures)
                </p>
              )}
            </div>
          </div>
          
          {/* Enfant malade */}
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-red-500" />
            <div className="flex-1">
              <span className="text-sm font-medium">Enfant malade</span>
              <p className="text-lg font-bold text-red-600">{agent.enfantMalade || 3} jours</p>
            </div>
          </div>
        </div>
        
        {showDetails && (
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
  );
};

export default AgentLeaveRights;


