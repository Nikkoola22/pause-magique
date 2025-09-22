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
  User,
  CalendarDays
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgentPersonalInfo from "@/components/AgentPersonalInfo";
import AgentLeaveRights from "@/components/AgentLeaveRights";

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
        // Accepter tous les rôles d'agents (employe, infirmiere, medecin, etc.)
        const agentRoles = ['employe', 'infirmiere', 'medecin', 'dentiste', 'assistante_dentaire', 'rh', 'comptabilite', 'sage_femme'];
        if (agentRoles.includes(userData.role)) {
          console.log('Agent authorized with role:', userData.role);
          setUserSession(userData);
          loadLeaveRequests();
        } else {
          console.log('User role not authorized:', userData.role);
          sessionStorage.removeItem('user_session');
        }
      } catch (error) {
        console.error('Error parsing session:', error);
        sessionStorage.removeItem('user_session');
      }
    } else {
      console.log('No session found');
    }
  }, []);

  const loadLeaveRequests = () => {
    // Charger depuis all_leave_requests (source unique de vérité)
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    // Filtrer seulement les nouvelles demandes (après 2025-09-20)
    const newRequests = allRequests.filter(req => {
      // Ne garder que les demandes créées après le 20/09/2025 (nouvelles demandes)
      return new Date(req.created_at) > new Date('2025-09-20T00:00:00Z');
    });
    
    // Trier par date de création (plus récent en premier)
    newRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`📋 ${newRequests.length} nouvelles demandes chargées`);
    setLeaveRequests(newRequests);
  };

  const handleCreateRequest = () => {
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

    const request: LeaveRequest = {
      id: Date.now().toString(),
      ...newRequest,
      days_count: daysCount,
      status: 'en_attente',
      created_at: new Date().toISOString()
    };

    setLeaveRequests(prev => [request, ...prev]);
    
    // Sauvegarder dans localStorage pour synchronisation avec le responsable
    const allRequests = JSON.parse(localStorage.getItem('all_leave_requests') || '[]');
    
    // Déterminer le nom de l'employé
    let employeeName = 'Agent Inconnu';
    if (userSession?.name) {
      employeeName = userSession.name;
    } else if (userSession?.username) {
      employeeName = userSession.username;
    } else if (userSession?.full_name) {
      employeeName = userSession.full_name;
    }
    
    const requestWithEmployeeName = {
      ...request,
      employee_name: employeeName
    };
    
    allRequests.unshift(requestWithEmployeeName);
    localStorage.setItem('all_leave_requests', JSON.stringify(allRequests));
    console.log('💾 Demande sauvegardée pour le responsable:', requestWithEmployeeName);
    
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
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    window.location.href = '/';
  };

  if (!userSession) {
    console.log('No user session, redirecting to login');
    return <Navigate to="/" replace />;
  }

  console.log('AgentDashboard rendering with session:', userSession);

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
            {/* Informations personnelles */}
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
            
            {/* Droits de congés */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  Calendrier des congés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Vue calendrier à implémenter</p>
                  <p className="text-sm text-gray-500 mt-2">Affichage de vos congés approuvés</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
