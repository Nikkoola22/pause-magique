import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Shield, UserCheck, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userCredentials, setUserCredentials] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleUserLogin = async () => {
    if (!userCredentials.username || !userCredentials.password) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir vos identifiants",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const username = userCredentials.username.trim();
      const password = userCredentials.password.trim();

      // Check for test admin credentials first (local fallback)
      if (username === 'admin' && password === 'test') {
        const testAdminUser = {
          id: '00000000-0000-0000-0000-000000000000',
          username: 'admin',
          first_name: 'Admin',
          last_name: 'Système',
          email: 'admin@test.local',
          role: 'admin',
          is_active: true,
          service: { name: 'Administration', description: 'Compte administrateur de test' }
        };
        
        sessionStorage.setItem('user_session', JSON.stringify(testAdminUser));
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${testAdminUser.first_name} ${testAdminUser.last_name}`,
        });
        
        navigate("/admin-dashboard");
        return;
      }

      // Check for test manager credentials (local fallback)
      if (username === 'resp.medecine' && password === 'password') {
        const testManagerUser = {
          id: '11111111-1111-1111-1111-111111111111',
          username: 'resp.medecine',
          first_name: 'Responsable',
          last_name: 'Médecine',
          email: 'resp.medecine@test.local',
          role: 'chef_service',
          is_active: true,
          service: 'Médecine'
        };
        
        sessionStorage.setItem('user_session', JSON.stringify(testManagerUser));
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${testManagerUser.first_name} ${testManagerUser.last_name}`,
        });
        
        navigate("/manager-dashboard");
        return;
      }

      // Check for test agent credentials (local fallback)
      if (username === 'agent1' && password === 'password') {
        const testAgentUser = {
          id: '22222222-2222-2222-2222-222222222222',
          username: 'agent1',
          first_name: 'Agent',
          last_name: 'Un',
          email: 'agent1@test.local',
          role: 'employe',
          is_active: true,
          service: 'Médecine',
          weeklyHours: 35,
          rttDays: 12,
          congésAnnuel: 25
        };
        
        sessionStorage.setItem('user_session', JSON.stringify(testAgentUser));
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${testAgentUser.first_name} ${testAgentUser.last_name}`,
        });
        
        navigate("/agent-dashboard");
        return;
      }

      // Check for test agent 3 credentials (local fallback)
      if (username === 'agent3' && password === 'password') {
        const testAgentUser = {
          id: '33333333-3333-3333-3333-333333333333',
          username: 'agent3',
          first_name: 'Nat',
          last_name: 'Danede',
          email: 'agent3@test.local',
          role: 'employe',
          is_active: true,
          service: 'Médecine',
          weeklyHours: 35,
          rttDays: 12,
          congésAnnuel: 25
        };
        
        sessionStorage.setItem('user_session', JSON.stringify(testAgentUser));
        
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${testAgentUser.first_name} ${testAgentUser.last_name}`,
        });
        
        navigate("/agent-dashboard");
        return;
      }

      const response = await fetch('https://jstgllotjifmgjxjsbpm.supabase.co/functions/v1/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdGdsbG90amlmbWdqeGpzYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzA0NDIsImV4cCI6MjA3MzQ0NjQ0Mn0.g-Zllg8NqrqNg-do5v2TCakK4RXUb6KAyvhS_yEiks4`
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast({
          title: "Erreur de connexion",
          description: "Nom d'utilisateur ou mot de passe incorrect",
          variant: "destructive"
        });
        return;
      }

      // Connexion réussie
      sessionStorage.setItem('user_session', JSON.stringify(result.user));
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${result.user.first_name} ${result.user.last_name}`,
      });
      
      // Rediriger selon le rôle
      switch (result.user.role) {
        case 'admin':
          navigate("/admin-dashboard");
          break;
        case 'chef_service':
          navigate("/manager-dashboard");
          break;
        case 'employe':
          navigate("/agent-dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary rounded-full">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Gestion des Congés</h1>
          <p className="text-muted-foreground">Connectez-vous pour accéder à votre espace personnel</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Connexion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username" 
                placeholder="Entrez votre nom d'utilisateur"
                value={userCredentials.username}
                onChange={(e) => setUserCredentials(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password" 
                type="password"
                placeholder="Entrez votre mot de passe"
                value={userCredentials.password}
                onChange={(e) => setUserCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleUserLogin}
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
              <LogIn className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Test Users Info */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Comptes de test</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-red-500" />
              <span><strong>Admin:</strong> admin / test</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-3 h-3 text-blue-500" />
              <span><strong>Responsable:</strong> resp.medecine / password</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-green-500" />
              <span><strong>Agent:</strong> agent1 / password</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-green-500" />
              <span><strong>Agent:</strong> agent3 / password (Nat Danede)</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Système de gestion des congés - 2024</p>
          <p className="mt-2">
            <a href="/debug" className="text-blue-500 hover:underline">
              🔧 Dashboard de Debug
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewLoginPage;
