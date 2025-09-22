import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Award,
  Building2
} from "lucide-react";

interface AgentPersonalInfoProps {
  agent: {
    id: string;
    name: string;
    role: string;
    service: string;
    email?: string;
    phone?: string;
    hireDate?: string;
    weeklyHours?: number;
    rttDays?: number;
    specialization?: string;
  };
  showFullInfo?: boolean;
}

const AgentPersonalInfo: React.FC<AgentPersonalInfoProps> = ({ 
  agent, 
  showFullInfo = true 
}) => {
  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'employe': 'Employé',
      'medecin': 'Médecin',
      'infirmiere': 'Infirmière',
      'dentiste': 'Dentiste',
      'assistante_dentaire': 'Assistante dentaire',
      'rh': 'Ressources humaines',
      'comptabilite': 'Comptabilité',
      'sage_femme': 'Sage-femme',
      'chef_service': 'Chef de service',
      'admin': 'Administrateur'
    };
    return roleLabels[role] || role;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informations personnelles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header avec avatar et nom */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {getInitials(agent.name)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{agent.name}</h2>
              <p className="text-gray-600">{getRoleLabel(agent.role)}</p>
              {/* Debug: Afficher le rôle brut pour vérification */}
              <p className="text-xs text-gray-400">Rôle brut: {agent.role}</p>
              <Badge variant="outline" className="mt-1">
                {agent.service}
              </Badge>
            </div>
          </div>

          {/* Informations détaillées */}
          {showFullInfo && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {agent.email || `${agent.name.toLowerCase().replace(' ', '.')}@hopital.fr`}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {agent.phone || '06 12 34 56 78'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  En poste depuis {agent.hireDate || 'Janvier 2023'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {agent.weeklyHours || 35}h/semaine - {agent.rttDays || 0}h RTT
                </span>
              </div>
              
              {agent.name === 'Sophie Bernard' && (
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Infirmière expérimentée - Spécialisation urgences</span>
                </div>
              )}
              
              {agent.specialization && (
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{agent.specialization}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentPersonalInfo;
