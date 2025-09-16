import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { LeaveRequestForm, LeaveRequest } from "@/components/LeaveRequestForm";
import { LeaveTable } from "@/components/LeaveTable";
import { AgentSummary } from "@/components/AgentSummary";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3, Plus, User } from "lucide-react";

const AgentPage = () => {
  const { id } = useParams();
  const employeeId = id ? parseInt(id) : null;

  const [employees] = useState([
    {
      id: 1,
      name: "BENDAOUD",
      firstName: "SOFIANE",
      seniority: "1607h",
      yearEntry: 2016,
      contractStart: "01/01/2024",
      contractEnd: "31/12/2024",
      workQuota: 21.5
    },
    {
      id: 2,
      name: "MARTIN",
      firstName: "MARIE", 
      seniority: "2140h",
      yearEntry: 2018,
      contractStart: "01/01/2024",
      contractEnd: "31/12/2024",
      workQuota: 35
    }
  ]);

  const [leaveRequests, setLeaveRequests] = useState<Record<number, LeaveRequest[]>>({
    1: [
      {
        id: "1",
        type: "CA",
        startDate: new Date("2024-02-26"),
        endDate: new Date("2024-03-06"),
        hours: "21:30:00",
        motif: "Congés familiaux",
        status: "approved"
      },
      {
        id: "2",
        type: "CF", 
        startDate: new Date("2024-03-22"),
        endDate: new Date("2024-03-25"),
        hours: "14:30:00",
        motif: "Formation professionnelle",
        status: "approved"
      },
      {
        id: "3",
        type: "CA",
        startDate: new Date("2024-08-01"),
        endDate: new Date("2024-08-19"),
        hours: "57:30:00",
        motif: "Congés d'été",
        status: "pending"
      }
    ],
    2: [
      {
        id: "4",
        type: "CA",
        startDate: new Date("2024-04-15"),
        endDate: new Date("2024-04-26"),
        hours: "35:00:00",
        motif: "Vacances de printemps",
        status: "approved"
      }
    ]
  });

  const employee = employees.find(emp => emp.id === employeeId);
  
  if (!employee) {
    return <Navigate to="/" replace />;
  }

  const employeeLeaveRequests = leaveRequests[employeeId!] || [];

  const handleAddLeaveRequest = (request: Omit<LeaveRequest, 'id'>) => {
    const newRequest: LeaveRequest = {
      ...request,
      id: Date.now().toString()
    };
    
    setLeaveRequests(prev => ({
      ...prev,
      [employeeId!]: [...(prev[employeeId!] || []), newRequest]
    }));
  };

  const handleUpdateRequest = (id: string, updatedRequest: Partial<LeaveRequest>) => {
    setLeaveRequests(prev => ({
      ...prev,
      [employeeId!]: prev[employeeId!].map(req => 
        req.id === id ? { ...req, ...updatedRequest } : req
      )
    }));
  };

  const handleDeleteRequest = (id: string) => {
    setLeaveRequests(prev => ({
      ...prev,
      [employeeId!]: prev[employeeId!].filter(req => req.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-admin-header text-admin-header-foreground shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">
                {employee.firstName} {employee.name}
              </h1>
              <p className="text-admin-header-foreground/80">
                Espace personnel - Gestion des congés
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation */}
        <Navigation employees={employees} showBackButton />

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Récapitulatif
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="request" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Demande
            </TabsTrigger>
            <TabsTrigger value="planning" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Planning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <AgentSummary 
              employee={employee}
              leaveRequests={employeeLeaveRequests}
            />
          </TabsContent>

          <TabsContent value="history">
            <LeaveTable
              employee={employee}
              leaveRequests={employeeLeaveRequests}
              onUpdateRequest={handleUpdateRequest}
              onDeleteRequest={handleDeleteRequest}
            />
          </TabsContent>

          <TabsContent value="request">
            <LeaveRequestForm onSubmit={handleAddLeaveRequest} />
          </TabsContent>

          <TabsContent value="planning">
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Planning à venir</h3>
              <p className="text-muted-foreground">
                Fonctionnalité de planning en cours de développement
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentPage;