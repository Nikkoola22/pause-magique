import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar,
  FileText, 
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  CalendarDays
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgentPersonalInfo from "@/components/AgentPersonalInfo";
import AgentLeaveRights from "@/components/AgentLeaveRights";
import WeeklySchedule from "@/components/WeeklySchedule";
import { supabase } from "@/integrations/supabase/client";

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
  employee_name?: string;
  agent_id?: string;
}

const AgentDashboard = () => {
  const { toast } = useToast();
  const [userSession, setUserSession] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    const session = sessionStorage.getItem('user_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        setUserSession(userData);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (userSession) {
      loadLeaveRequests();
    }
  }, [userSession]);

  const loadLeaveRequests = async () => {
    if (!userSession?.id) return;

    try {
      console.log('🔄 Chargement des demandes depuis Supabase...');
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', userSession.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        loadFromLocalStorage();
        return;
      }

      if (data) {
        console.log(`📋 ${data.length} demandes chargées depuis Supabase`);
        setLeaveRequests(data as LeaveRequest[]);
      }
    } catch (err) {
      console.error('❌ Exception chargement:', err);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    console.log('⚠️ Utilisation du localStorage (fallback)');
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    const userRequests = allRequests.filter((req: any) => req.agent_id === userSession.id || !req.agent_id);
    setLeaveRequests(userRequests);
  };

  const handleCreateRequest = async () => {
    if (!newRequest.leave_type || !newRequest.start_date || !newRequest.end_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date(newRequest.start_date);
    const endDate = new Date(newRequest.end_date);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let employeeName = 'Agent Inconnu';
    if (userSession?.name) employeeName = userSession.name;
    else if (userSession?.username) employeeName = userSession.username;
    else if (userSession?.full_name) employeeName = userSession.full_name;

    const requestData = {
      leave_type: newRequest.leave_type,
      start_date: newRequest.start_date,
      end_date: newRequest.end_date,
      days_count: daysCount,
      reason: newRequest.reason,
      status: 'en_attente',
      employee_id: userSession.id,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([requestData as any])
        .select();

      if (error) throw error;

      console.log('✅ Demande sauvegardée sur Supabase:', data);
      
      if (data && data[0]) {
        setLeaveRequests(prev => [data[0] as LeaveRequest, ...prev]);
      } else {
        const mockReq = { ...requestData, id: Date.now().toString(), agent_id: userSession.id, employee_name: employeeName } as any;
        setLeaveRequests(prev => [mockReq, ...prev]);
      }

      const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
      allRequests.unshift({ ...requestData, id: Date.now().toString(), agent_id: userSession.id, employee_name: employeeName });
      localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));

      setNewRequest({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
      });
      setShowCreateForm(false);

      toast({
        title: "Demande créée",
        description: "Votre demande de congé a été soumise avec succès.",
      });

    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la demande",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    window.location.href = '/';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approuve':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'refuse':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = leaveRequests.filter(req => req.status === 'en_attente');
  const approvedRequests = leaveRequests.filter(req => req.status === 'approuve');
  const rejectedRequests = leaveRequests.filter(req => req.status === 'refuse');

  const leaveTypes = [
    'Congés payés',
    'Maladie',
    'Formation',
    'Maternité',
    'RTT',
    'ASA',
    'Autre'
  ];

  if (!userSession) {
    // Return null to avoid redirect loop during test
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Tableau de bord Agent
              </h1>
              <Badge variant="outline" className="ml-4 bg-green-100 text-green-800">
                {userSession.service || 'Service'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Connecté en tant que <strong>{userSession.name || userSession.username}</strong>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informations personnelles et droits de congés */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgentPersonalInfo 
              agent={{
                id: userSession.id,
                name: userSession.name,
                role: userSession.role,
                service: userSession.service,
                email: userSession.email,
                phone: userSession.phone,
                hireDate: userSession.hireDate,
                weeklyHours: userSession.weeklyHours,
                rttDays: userSession.rttDays,
                specialization: userSession.specialization
              }}
              showFullInfo={true}
            />
            
            <AgentLeaveRights 
              agent={{
                id: userSession.id,
                name: userSession.name,
                role: userSession.role,
                weeklyHours: userSession.weeklyHours,
                rttDays: userSession.rttDays,
                congésAnnuel: userSession.congésAnnuel,
                heuresFormation: userSession.heuresFormation,
                enfantMalade: userSession.enfantMalade
              }}
              leaveRequests={leaveRequests}
              showDetails={true}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approuvées</p>
                  <p className="text-2xl font-semibold text-gray-900">{approvedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Refusées</p>
                  <p className="text-2xl font-semibold text-gray-900">{rejectedRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total demandes</p>
                  <p className="text-2xl font-semibold text-gray-900">{leaveRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests">Mes demandes</TabsTrigger>
            <TabsTrigger value="create">Nouvelle demande</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Mes demandes de congés
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune demande de congé</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveRequests.map((request) => (
                      <Card key={request.id} className={
                        request.status === 'en_attente' ? 'border-l-4 border-l-yellow-500' :
                        request.status === 'approuve' ? 'border-l-4 border-l-green-500' :
                        'border-l-4 border-l-red-500'
                      }>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="font-semibold">{request.leave_type}</h3>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Du:</span> {new Date(request.start_date).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                  <span className="font-medium">Au:</span> {new Date(request.end_date).toLocaleDateString('fr-FR')}
                                </div>
                                <div>
                                  <span className="font-medium">Durée:</span> {request.days_count} jour(s)
                                </div>
                                <div>
                                  <span className="font-medium">Créée le:</span> {new Date(request.created_at).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                              {request.reason && (
                                <div className="mt-2">
                                  <span className="font-medium text-sm">Motif:</span>
                                  <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                                </div>
                              )}
                              {request.comments && (
                                <div className="mt-2">
                                  <span className="font-medium text-sm">Commentaire:</span>
                                  <p className="text-sm text-gray-600 mt-1">{request.comments}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nouvelle demande de congé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave_type">Type de congé *</Label>
                    <Select value={newRequest.leave_type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, leave_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newRequest.start_date}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newRequest.end_date}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Motif (optionnel)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Décrivez le motif de votre demande..."
                      value={newRequest.reason}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateRequest}>
                    <Plus className="w-4 h-4 mr-2" />
                    Soumettre la demande
                  </Button>
                  <Button variant="outline" onClick={() => setNewRequest({
                    leave_type: '',
                    start_date: '',
                    end_date: '',
                    reason: ''
                  })}>
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Mon Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklySchedule 
                  agents={[{
                    id: userSession.id,
                    name: userSession.name || userSession.username || 'Moi',
                    service: userSession.service,
                    role: userSession.role
                  }]} 
                  forceViewMode={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
