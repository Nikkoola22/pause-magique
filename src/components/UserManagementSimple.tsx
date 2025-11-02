import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Save, X, RotateCcw } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'chef_service';
  weeklyHours: number;
  rttDays: number;
  service?: string;
  phone?: string;
  hireDate?: string;
  specialization?: string;
}

const UserManagementSimple = () => {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent' as 'agent' | 'chef_service',
    service: '',
    hireDate: '',
    specialization: '',
    weeklyHours: 35
  });

  // Données par défaut (vide - utiliser Supabase uniquement)
  const defaultUsers: User[] = [];

  // Charger les utilisateurs depuis localStorage ou utiliser les données par défaut
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('admin_users');
      if (savedUsers) {
        return JSON.parse(savedUsers);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
    return defaultUsers;
  });

  // Sauvegarder les utilisateurs dans localStorage
  const saveUsersToStorage = (usersToSave: User[]) => {
    try {
      localStorage.setItem('admin_users', JSON.stringify(usersToSave));
      console.log('Utilisateurs sauvegardés dans localStorage');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Effet pour sauvegarder automatiquement les changements
  React.useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  const calculateRTT = (hours: number): number => {
    if (hours >= 38) return 18;
    if (hours >= 36) return 6;
    return 0;
  };

  const handleHoursChange = (user: User, hours: number): User => {
    return {
      ...user,
      weeklyHours: hours,
      rttDays: calculateRTT(hours)
    };
  };

  // Filtrer les utilisateurs par service
  const filteredUsers = users.filter(user => 
    selectedService === 'all' || user.service === selectedService
  );

  // Fonctions pour gérer l'édition
  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveEdit = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setEditingUser(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  // Fonctions pour gérer la création d'utilisateur
  const handleCreateUser = () => {
    const newUser: User = {
      id: Date.now().toString(), // ID temporaire
      name: createFormData.name,
      email: createFormData.email,
      role: createFormData.role,
      weeklyHours: createFormData.weeklyHours,
      rttDays: calculateRTT(createFormData.weeklyHours),
      service: createFormData.service,
      phone: createFormData.phone,
      hireDate: createFormData.hireDate,
      specialization: createFormData.specialization
    };

    setUsers([...users, newUser]);
    
    // Reset form
    setCreateFormData({
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      service: '',
      hireDate: '',
      specialization: '',
      weeklyHours: 35
    });
    setShowCreateForm(false);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setCreateFormData({
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      service: '',
      hireDate: '',
      specialization: '',
      weeklyHours: 35
    });
  };

  // Fonction pour réinitialiser les données
  const handleResetData = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
      localStorage.removeItem('admin_users');
      setUsers(defaultUsers);
      console.log('Données réinitialisées');
    }
  };

  // Composant de formulaire d'édition
  const EditUserForm = ({ user, onSave, onCancel }: { user: User; onSave: (user: User) => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState(user);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const updatedUser = {
        ...formData,
        rttDays: calculateRTT(formData.weeklyHours)
      };
      onSave(updatedUser);
    };

    const handleHoursChange = (hours: number) => {
      setFormData({
        ...formData,
        weeklyHours: hours,
        rttDays: calculateRTT(hours)
      });
    };

    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier la fiche utilisateur
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-name">Nom complet</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'agent' | 'chef_service') => 
                    setFormData({...formData, role: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="chef_service">Chef de Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-service">Service</Label>
                <Select
                  value={formData.service || ''}
                  onValueChange={(value) => 
                    setFormData({...formData, service: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Médecine">Médecine</SelectItem>
                    <SelectItem value="Chirurgie">Chirurgie</SelectItem>
                    <SelectItem value="Urgences">Urgences</SelectItem>
                    <SelectItem value="Radiologie">Radiologie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-hireDate">Date d'embauche</Label>
                <Input
                  id="edit-hireDate"
                  value={formData.hireDate || ''}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                  placeholder="Mars 2022"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-specialization">Spécialisation</Label>
                <Input
                  id="edit-specialization"
                  value={formData.specialization || ''}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  placeholder="Ex: Infirmière expérimentée - Spécialisation urgences"
                />
              </div>
              <div>
                <Label htmlFor="edit-hours">Heures par semaine</Label>
                <Input
                  id="edit-hours"
                  type="number"
                  min="35"
                  max="40"
                  value={formData.weeklyHours}
                  onChange={(e) => handleHoursChange(parseInt(e.target.value))}
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  RTT automatique: {formData.rttDays} jour{formData.rttDays > 1 ? 's' : ''}
                  {formData.weeklyHours >= 38 && ' (38h = 18 jours RTT)'}
                  {formData.weeklyHours === 36 && ' (36h = 6 jours RTT)'}
                  {formData.weeklyHours === 35 && ' (35h = 0 jour RTT)'}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Formulaire d'édition modal */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Gestion des Utilisateurs
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetData}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtre par service */}
          <div className="mb-6">
            <Label htmlFor="serviceFilter">Filtrer par service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Tous les services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                <SelectItem value="Médecine">Médecine</SelectItem>
                <SelectItem value="Chirurgie">Chirurgie</SelectItem>
                <SelectItem value="Urgences">Urgences</SelectItem>
                <SelectItem value="Radiologie">Radiologie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!showCreateForm ? (
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateForm(true)} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Créer un nouvel utilisateur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name" 
                    placeholder="Nom complet"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@hopital.fr"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input 
                    id="phone" 
                    placeholder="06 12 34 56 78"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={createFormData.role}
                    onValueChange={(value: 'agent' | 'chef_service') => 
                      setCreateFormData({...createFormData, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="chef_service">Chef de Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={createFormData.service}
                    onValueChange={(value) => 
                      setCreateFormData({...createFormData, service: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Médecine">Médecine</SelectItem>
                      <SelectItem value="Chirurgie">Chirurgie</SelectItem>
                      <SelectItem value="Urgences">Urgences</SelectItem>
                      <SelectItem value="Radiologie">Radiologie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hireDate">Date d'embauche</Label>
                  <Input 
                    id="hireDate" 
                    placeholder="Mars 2022"
                    value={createFormData.hireDate}
                    onChange={(e) => setCreateFormData({...createFormData, hireDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialization">Spécialisation</Label>
                  <Input 
                    id="specialization" 
                    placeholder="Ex: Infirmière expérimentée - Spécialisation urgences"
                    value={createFormData.specialization}
                    onChange={(e) => setCreateFormData({...createFormData, specialization: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="weeklyHours">Heures par semaine</Label>
                  <Input 
                    id="weeklyHours" 
                    type="number" 
                    min="35" 
                    max="40" 
                    value={createFormData.weeklyHours}
                    onChange={(e) => setCreateFormData({...createFormData, weeklyHours: parseInt(e.target.value)})}
                    required
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    RTT automatique: {calculateRTT(createFormData.weeklyHours)} jour{calculateRTT(createFormData.weeklyHours) > 1 ? 's' : ''}
                    {createFormData.weeklyHours >= 38 && ' (38h = 18 jours RTT)'}
                    {createFormData.weeklyHours === 36 && ' (36h = 6 jours RTT)'}
                    {createFormData.weeklyHours === 35 && ' (35h = 0 jour RTT)'}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelCreate}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleCreateUser} disabled={!createFormData.name || !createFormData.email}>
                  <Save className="h-4 w-4 mr-2" />
                  Créer l'utilisateur
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-gray-500">{user.phone}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={user.role === 'agent' ? 'secondary' : 'default'}>
                      {user.role === 'agent' ? 'Agent' : 'Chef de Service'}
                    </Badge>
                    {user.service && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {user.service}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">
                      {user.weeklyHours}h/semaine - {user.rttDays} RTT
                    </span>
                    {user.hireDate && (
                      <span className="text-sm text-gray-500">
                        Depuis {user.hireDate}
                      </span>
                    )}
                  </div>
                  {user.specialization && (
                    <p className="text-sm text-blue-600 mt-1 italic">
                      {user.specialization}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    title="Modifier la fiche"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    title="Supprimer l'utilisateur"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun utilisateur trouvé pour ce service.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementSimple;
