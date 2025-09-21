import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'en_attente' | 'approuve' | 'refuse';
  created_at: string;
  employee_name: string;
}

interface Agent {
  id: string;
  name: string;
  service: string;
  role?: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  weeklyHours?: number;
  rttDays?: number;
}

interface MonthlyLeaveCalendarProps {
  agents: Agent[];
  leaveRequests: LeaveRequest[];
}

const MonthlyLeaveCalendar: React.FC<MonthlyLeaveCalendarProps> = ({ agents, leaveRequests }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agentColors, setAgentColors] = useState<Record<string, string>>({});

  // Générer des couleurs uniques pour chaque agent
  useEffect(() => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-amber-500'
    ];

    const newAgentColors: Record<string, string> = {};
    agents.forEach((agent, index) => {
      newAgentColors[agent.name] = colors[index % colors.length];
    });
    setAgentColors(newAgentColors);
  }, [agents]);

  // Obtenir le nombre de jours dans le mois
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Obtenir le nom du mois en français
  const getMonthName = (date: Date) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[date.getMonth()];
  };

  // Obtenir les congés approuvés pour un agent et un jour donné
  const getLeaveForAgentAndDay = (agentName: string, day: number) => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const targetDate = new Date(currentYear, currentMonth, day);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    return leaveRequests.filter(request => 
      request.employee_name === agentName &&
      request.status === 'approuve' &&
      request.start_date <= targetDateStr &&
      request.end_date >= targetDateStr
    );
  };

  // Navigation entre les mois
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const monthName = getMonthName(currentDate);
  const year = currentDate.getFullYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendrier des congés - {monthName} {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-lg font-semibold">
            {monthName} {year}
          </div>
        </div>

        {/* Légende des couleurs */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Légende des agents :</h4>
          <div className="flex flex-wrap gap-2">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${agentColors[agent.name] || 'bg-gray-400'}`}></div>
                <span className="text-xs">{agent.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grille du calendrier */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* En-tête avec les jours du mois */}
            <div className="flex mb-2">
              <div className="w-32 flex-shrink-0 text-xs font-medium text-gray-600 py-2">
                Agent
              </div>
              <div className="flex flex-1">
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <div
                    key={i + 1}
                    className="flex-1 text-center text-xs font-medium text-gray-600 py-2 border-l border-gray-200"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Lignes pour chaque agent */}
            {agents.map(agent => (
              <div key={agent.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                {/* Nom de l'agent */}
                <div className="w-32 flex-shrink-0 py-2 px-2 text-sm font-medium text-gray-900 border-r border-gray-200">
                  <div className="truncate" title={agent.name}>
                    {agent.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {agent.role}
                  </div>
                </div>

                {/* Cases pour chaque jour du mois */}
                <div className="flex flex-1">
                  {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                    const day = dayIndex + 1;
                    const leaves = getLeaveForAgentAndDay(agent.name, day);
                    const hasLeave = leaves.length > 0;
                    const isToday = new Date().getDate() === day && 
                                   new Date().getMonth() === currentDate.getMonth() && 
                                   new Date().getFullYear() === currentDate.getFullYear();

                    return (
                      <div
                        key={day}
                        className={`
                          flex-1 h-12 border-l border-gray-200 flex items-center justify-center relative
                          ${hasLeave ? agentColors[agent.name] || 'bg-gray-400' : 'bg-white'}
                          ${isToday ? 'ring-2 ring-blue-500' : ''}
                          hover:opacity-80 cursor-pointer
                        `}
                        title={hasLeave ? `${leaves.length} congé(s) - ${leaves.map(l => l.leave_type).join(', ')}` : `Jour ${day}`}
                      >
                        {hasLeave && (
                          <div className="text-white text-xs font-bold">
                            {leaves.length > 1 ? leaves.length : ''}
                          </div>
                        )}
                        {isToday && !hasLeave && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques du mois */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Statistiques du mois :</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total agents :</span>
              <span className="ml-2 font-semibold">{agents.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Jours de congés :</span>
              <span className="ml-2 font-semibold">
                {leaveRequests
                  .filter(req => req.status === 'approuve' && 
                    new Date(req.start_date).getMonth() === currentDate.getMonth() &&
                    new Date(req.start_date).getFullYear() === currentDate.getFullYear())
                  .reduce((sum, req) => sum + req.days_count, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Demandes approuvées :</span>
              <span className="ml-2 font-semibold">
                {leaveRequests
                  .filter(req => req.status === 'approuve' && 
                    new Date(req.start_date).getMonth() === currentDate.getMonth() &&
                    new Date(req.start_date).getFullYear() === currentDate.getFullYear())
                  .length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Agents en congé :</span>
              <span className="ml-2 font-semibold">
                {new Set(
                  leaveRequests
                    .filter(req => req.status === 'approuve' && 
                      new Date(req.start_date).getMonth() === currentDate.getMonth() &&
                      new Date(req.start_date).getFullYear() === currentDate.getFullYear())
                    .map(req => req.employee_name)
                ).size}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyLeaveCalendar;
