import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { LeaveRequest } from "./LeaveRequestForm";

interface EmployeeInfo {
  name: string;
  firstName: string;
  seniority: string;
  yearEntry: number;
  contractStart: string;
  contractEnd: string;
  workQuota: number;
}

interface AgentSummaryProps {
  employee: EmployeeInfo;
  leaveRequests: LeaveRequest[];
}

export function AgentSummary({ employee, leaveRequests }: AgentSummaryProps) {
  // Calculs des statistiques
  const totalRequests = leaveRequests.length;
  const approvedRequests = leaveRequests.filter(req => req.status === 'approved');
  const pendingRequests = leaveRequests.filter(req => req.status === 'pending');
  const rejectedRequests = leaveRequests.filter(req => req.status === 'rejected');

  // Calcul des heures par type de congé
  const hoursByType = leaveRequests
    .filter(req => req.status === 'approved')
    .reduce((acc, req) => {
      const [hours, minutes] = req.hours.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      
      if (!acc[req.type]) acc[req.type] = 0;
      acc[req.type] += totalMinutes;
      return acc;
    }, {} as Record<string, number>);

  const totalApprovedMinutes = Object.values(hoursByType).reduce((sum, minutes) => sum + minutes, 0);
  
  // Estimation des congés annuels (base 25 jours = 175h pour temps plein)
  const annualLeaveQuota = Math.floor(employee.workQuota * 25 / 35 * 7); // en heures
  const usedAnnualLeave = Math.floor((hoursByType['CA'] || 0) / 60);
  const remainingAnnualLeave = Math.max(0, annualLeaveQuota - usedAnnualLeave);
  const leaveUsagePercentage = Math.min(100, (usedAnnualLeave / annualLeaveQuota) * 100);

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Profil de l'agent */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="w-5 h-5" />
            Profil Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-lg">{employee.firstName} {employee.name}</h3>
              <p className="text-muted-foreground">Agent de la fonction publique</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ancienneté</p>
              <p className="font-medium">{employee.seniority}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Année d'entrée</p>
              <p className="font-medium">{employee.yearEntry}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quotité de travail</p>
              <p className="font-medium">{employee.workQuota}h / semaine</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Période contrat</p>
              <p className="font-medium">{employee.contractStart} - {employee.contractEnd}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques des demandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total demandes</p>
                <p className="text-2xl font-bold">{totalRequests}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approuvées</p>
                <p className="text-2xl font-bold text-success">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{pendingRequests.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Heures prises</p>
                <p className="text-2xl font-bold text-accent">
                  {formatMinutesToHours(totalApprovedMinutes)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solde des congés annuels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Solde Congés Annuels 2024
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Quota annuel</p>
              <p className="text-2xl font-bold text-primary">{annualLeaveQuota}h</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Utilisé</p>
              <p className="text-2xl font-bold text-accent">{usedAnnualLeave}h</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Restant</p>
              <p className="text-2xl font-bold text-success">{remainingAnnualLeave}h</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Utilisation des congés</span>
              <span>{leaveUsagePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={leaveUsagePercentage} className="h-3" />
          </div>

          {leaveUsagePercentage > 80 && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-warning" />
              <p className="text-sm text-warning-foreground">
                Attention : Plus de 80% des congés annuels ont été utilisés
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Répartition par type de congé */}
      {Object.keys(hoursByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type de congé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(hoursByType).map(([type, minutes]) => (
                <div key={type} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Badge variant="outline">{type}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatMinutesToHours(minutes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}