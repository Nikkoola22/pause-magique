import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [loginMode, setLoginMode] = useState<"select" | "admin">("select");
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const employees = [
    {
      id: 1,
      name: "BENDAOUD",
      firstName: "SOFIANE",
      fullName: "BENDAOUD SOFIANE"
    },
    {
      id: 2,
      name: "MARTIN",
      firstName: "MARIE",
      fullName: "MARTIN MARIE"
    },
    {
      id: 3,
      name: "ROUSSEAU",
      firstName: "ANTOINE",
      fullName: "ROUSSEAU ANTOINE",
      email: "antoine.rousseau@hopital.fr",
      phone: "06 12 34 56 82",
      role: "Médecin",
      service: "Médecine"
    }
  ];

  const handleAgentLogin = () => {
    if (!selectedAgent) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un agent",
        variant: "destructive"
      });
      return;
    }
    
    navigate(`/agent/${selectedAgent}`);
  };

  const handleAdminLogin = async () => {
    if (!adminCredentials.username || !adminCredentials.password) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir vos identifiants",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Vérification locale temporaire (en attendant le déploiement de la fonction)
    if (adminCredentials.username === 'admin' && adminCredentials.password === 'password') {
      // Simuler une session admin
      const mockAdmin = {
        id: 'admin-123',
        username: 'admin',
        created_at: new Date().toISOString()
      };
      
      sessionStorage.setItem('admin_session', JSON.stringify(mockAdmin));
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'espace administrateur",
      });
      
      navigate("/dashboard");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('https://jstgllotjifmgjxjsbpm.supabase.co/functions/v1/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdGdsbG90amlmbWdqeGpzYnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4NzA0NDIsImV4cCI6MjA3MzQ0NjQ0Mn0.g-Zllg8NqrqNg-do5v2TCakK4RXUb6KAyvhS_yEiks4`
        },
        body: JSON.stringify({
          username: adminCredentials.username,
          password: adminCredentials.password
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
      sessionStorage.setItem('admin_session', JSON.stringify(result.admin));
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'espace administrateur",
      });
      
      navigate("/dashboard");
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
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestion des Congés
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à votre espace personnel
          </p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={loginMode === "select" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setLoginMode("select")}
          >
            <User className="w-4 h-4 mr-2" />
            Agent
          </Button>
          <Button
            variant={loginMode === "admin" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setLoginMode("admin")}
          >
            <Users className="w-4 h-4 mr-2" />
            Administrateur
          </Button>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {loginMode === "select" ? "Connexion Agent" : "Connexion Administrateur"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loginMode === "select" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="agent-select">Sélectionner votre profil</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez votre nom" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAgentLogin} 
                  className="w-full"
                  size="lg"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Accéder à mon espace
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input 
                      id="username" 
                      placeholder="Entrez votre nom d'utilisateur"
                      type="text"
                      value={adminCredentials.username}
                      onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input 
                      id="password" 
                      placeholder="Entrez votre mot de passe"
                      type="password"
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAdminLogin} 
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {isLoading ? "Connexion..." : "Tableau de bord"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Système de gestion des congés - 2024</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;