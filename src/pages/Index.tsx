import { useState } from "react";
import { LeaveRequestForm, LeaveRequest } from "@/components/LeaveRequestForm";
import { LeaveTable } from "@/components/LeaveTable";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, BarChart3 } from "lucide-react";

const Index = () => {
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

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(1);
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
      }
    ],
    2: []
  });

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)!;
  const employeeLeaveRequests = leaveRequests[selectedEmployeeId] || [];

  const handleAddLeaveRequest = (request: Omit<LeaveRequest, 'id'>) => {
    const newRequest: LeaveRequest = {
      ...request,
      id: Date.now().toString()
    };
    
    setLeaveRequests(prev => ({
      ...prev,
      [selectedEmployeeId]: [...(prev[selectedEmployeeId] || []), newRequest]
    }));
  };

  const handleUpdateRequest = (id: string, updatedRequest: Partial<LeaveRequest>) => {
    setLeaveRequests(prev => ({
      ...prev,
      [selectedEmployeeId]: prev[selectedEmployeeId].map(req => 
        req.id === id ? { ...req, ...updatedRequest } : req
      )
    }));
  };

  const handleDeleteRequest = (id: string) => {
    setLeaveRequests(prev => ({
      ...prev,
      [selectedEmployeeId]: prev[selectedEmployeeId].filter(req => req.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-admin-header text-admin-header-foreground shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Gestion des Congés</h1>
              <p className="text-admin-header-foreground/80">Tableau de bord administratif</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="request" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Nouvelle demande
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Employee Selector */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Sélectionner un agent</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employees.map(employee => (
                    <div
                      key={employee.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedEmployeeId === employee.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                    >
                      <div className="font-semibold">
                        {employee.name} {employee.firstName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Ancienneté: {employee.seniority} • Quotité: {employee.workQuota}h
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leave Table */}
            <LeaveTable
              employee={selectedEmployee}
              leaveRequests={employeeLeaveRequests}
              onUpdateRequest={handleUpdateRequest}
              onDeleteRequest={handleDeleteRequest}
            />
          </TabsContent>

          <TabsContent value="request">
            <LeaveRequestForm onSubmit={handleAddLeaveRequest} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
