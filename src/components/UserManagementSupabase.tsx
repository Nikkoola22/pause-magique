import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Save, X, RotateCcw, Database as DatabaseIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface UserWithExtras extends Profile {
  weeklyHours?: number;
  rttDays?: number;
  specialization?: string;
}

const UserManagementSupabase = () => {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserWithExtras | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [createFormData, setCreateFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'employe' as 'admin' | 'chef_service' | 'employe',
    service: 'medecine' as 'medecine' | null,
    hire_date: '',
    specialization: '',
    weeklyHours: 35
  });
  const [users, setUsers] = useState<UserWithExtras[]>([]);

  // Charger les utilisateurs depuis Supabase
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des utilisateurs depuis Supabase...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        return;
      }

      console.log(`📊 ${data?.length || 0} utilisateurs chargés depuis Supabase`);

      // Ajouter les données calculées (RTT, etc.)
      const usersWithExtras: UserWithExtras[] = data.map(user => {
        // Charger les heures hebdomadaires depuis localStorage
        const savedData = localStorage.getItem(`agent_${user.id}_hours`);
        let weeklyHours = 35;
        let rttDays = 0;
        
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            weeklyHours = parsed.weeklyHours || 35;
            rttDays = parsed.rttDays || 0;
          } catch (error) {
            console.error('Erreur lors du parsing des données localStorage:', error);
          }
        }
        
        return {
          ...user,
          weeklyHours,
          rttDays,
          specialization: user.full_name === 'Sophie Bernard' ? 'Infirmière expérimentée - Spécialisation urgences' : undefined
        };
      });

      setUsers(usersWithExtras);
      console.log('✅ Utilisateurs mis à jour dans l\'interface');
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    
    // Écouter les événements de mise à jour des profils
    const handleAgentProfileUpdated = (event: CustomEvent) => {
      console.log('🔄 Événement agentProfileUpdated reçu:', event.detail);
      // Recharger la liste des utilisateurs
      loadUsers();
    };
    
    const handleAgentDataUpdated = (event: CustomEvent) => {
      console.log('🔄 Événement agentDataUpdated reçu:', event.detail);
      // Recharger la liste des utilisateurs pour mettre à jour les heures/RTT
      loadUsers();
    };
    
    // Ajouter les listeners
    window.addEventListener('agentProfileUpdated', handleAgentProfileUpdated as EventListener);
    window.addEventListener('agentDataUpdated', handleAgentDataUpdated as EventListener);
    
    // Nettoyer les listeners au démontage
    return () => {
      window.removeEventListener('agentProfileUpdated', handleAgentProfileUpdated as EventListener);
      window.removeEventListener('agentDataUpdated', handleAgentDataUpdated as EventListener);
    };
  }, []);

  const calculateRTT = (hours: number): number => {
    if (hours >= 38) return 18;
    if (hours >= 36) return 6;
    return 0;
  };

  // Filtrer les utilisateurs par service
  const filteredUsers = users.filter(user => 
    selectedService === 'all' || user.service === selectedService
  );

  // Fonctions pour gérer l'édition
  const handleEditUser = (user: UserWithExtras) => {
    // Rediriger vers la fiche agent au lieu d'ouvrir le modal
    window.location.href = `/agent/${user.id}`;
  };

  // Écouter les changements de localStorage pour recharger automatiquement
  React.useEffect(() => {
    const handleStorageChange = () => {
      loadUsers();
    };
    
    const handleAgentDataUpdate = () => {
      loadUsers();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agentDataUpdated', handleAgentDataUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentDataUpdated', handleAgentDataUpdate);
    };
  }, []);

  const handleSaveEdit = async (updatedUser: UserWithExtras) => {
    console.log('🚀 DEBUT handleSaveEdit - Utilisateur reçu:', updatedUser);
    
    try {
      setSaving(true);
      console.log('💾 Sauvegarde de l\'utilisateur:', updatedUser.full_name, updatedUser.id);
      
      // Vérifier que l'utilisateur a un ID valide
      if (!updatedUser.id) {
        console.error('❌ ID utilisateur manquant!');
        alert('Erreur: ID utilisateur manquant');
        return;
      }
      
      console.log('📡 Envoi vers Supabase...');
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          service: updatedUser.service,
          hire_date: updatedUser.hire_date
        })
        .eq('id', updatedUser.id)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        alert(`Erreur lors de la sauvegarde: ${error.message}`);
        setSaving(false);
        return;
      }

      console.log('✅ Données mises à jour dans Supabase:', data);

      // Mettre à jour la liste locale
      console.log('🔄 Mise à jour de la liste locale...');
      setUsers(prevUsers => {
        const newUsers = prevUsers.map(user => 
          user.id === updatedUser.id ? { ...user, ...updatedUser } : user
        );
        console.log('📋 Nouvelle liste:', newUsers.length, 'utilisateurs');
        return newUsers;
      });
      
      console.log('🚪 Fermeture du modal...');
      setEditingUser(null);
      console.log('✅ Utilisateur mis à jour avec succès dans l\'interface');
      
      // Recharger depuis Supabase pour s'assurer de la cohérence
      console.log('🔄 Rechargement depuis Supabase...');
      await loadUsers();
      
      console.log('🎉 SAUVEGARDE TERMINÉE AVEC SUCCÈS!');
      
    } catch (error) {
      console.error('❌ Erreur dans handleSaveEdit:', error);
      alert(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      console.log('🔚 Fin de handleSaveEdit, setSaving(false)');
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
        return;
      }

      setUsers(users.filter(user => user.id !== userId));
      console.log('Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Fonction pour générer un UUID compatible
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Fonction pour convertir la date d'embauche en format ISO
  const convertHireDate = (dateString: string | null): string | null => {
    if (!dateString) return null;
    
    // Si c'est déjà au format ISO, le retourner tel quel
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Si c'est au format "Mois YYYY", le convertir
    const monthMap: { [key: string]: string } = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
      'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
      'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };
    
    const parts = dateString.toLowerCase().trim().split(' ');
    if (parts.length === 2) {
      const month = monthMap[parts[0]];
      const year = parts[1];
      
      if (month && year && year.match(/^\d{4}$/)) {
        return `${year}-${month}-01`; // Premier jour du mois
      }
    }
    
    // Si on ne peut pas convertir, retourner null
    console.warn(`Impossible de convertir la date: ${dateString}`);
    return null;
  };

  // Fonctions pour gérer la création d'utilisateur
  const handleCreateUser = async () => {
    try {
      const newUser: ProfileInsert = {
        id: generateUUID(),
        full_name: createFormData.full_name,
        email: createFormData.email,
        phone: createFormData.phone || null,
        role: createFormData.role,
        service: createFormData.service,
        hire_date: convertHireDate(createFormData.hire_date)
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création:', error);
        alert('Erreur lors de la création de l\'utilisateur');
        return;
      }

      // Ajouter le nouvel utilisateur à la liste
      const newUserWithExtras: UserWithExtras = {
        ...data,
        weeklyHours: createFormData.weeklyHours,
        rttDays: calculateRTT(createFormData.weeklyHours),
        specialization: createFormData.specialization || undefined
      };

      setUsers([...users, newUserWithExtras]);
      
      // 🔄 SYNCHRONISATION AUTOMATIQUE AVEC LOCALSTORAGE
      console.log('🔄 Synchronisation automatique avec localStorage...');
      
      // Créer les données agent dans localStorage
      const agentStorageData = {
        id: data.id,
        name: data.full_name,
        username: `agent_${data.id.substring(0, 8)}`,
        role: data.role,
        service: data.service,
        email: data.email,
        phone: data.phone,
        hireDate: data.hire_date,
        weeklyHours: createFormData.weeklyHours,
        rttDays: calculateRTT(createFormData.weeklyHours),
        specialization: createFormData.specialization || undefined
      };
      
      // Sauvegarder dans localStorage
      localStorage.setItem(`agent_${data.id}_hours`, JSON.stringify(agentStorageData));
      console.log('✅ Données agent sauvegardées dans localStorage');
      
      // Créer un planning par défaut
      const weeklySchedules = JSON.parse(localStorage.getItem('weeklySchedules') || '{}');
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1); // Lundi de cette semaine
      
      const year = weekStart.getFullYear();
      const month = String(weekStart.getMonth() + 1).padStart(2, '0');
      const day = String(weekStart.getDate()).padStart(2, '0');
      const weekKey = `${data.id}_${year}-${month}-${day}`;
      
      const defaultSchedule = [
        { day: 'Lundi', time: 'Matin', status: 'working', startTime: '08:00', endTime: '12:00' },
        { day: 'Lundi', time: 'Midi', status: 'break', startTime: '12:00', endTime: '13:00' },
        { day: 'Lundi', time: 'Après-midi', status: 'working', startTime: '13:00', endTime: '17:00' },
        { day: 'Mardi', time: 'Matin', status: 'working', startTime: '08:00', endTime: '12:00' },
        { day: 'Mardi', time: 'Midi', status: 'break', startTime: '12:00', endTime: '13:00' },
        { day: 'Mardi', time: 'Après-midi', status: 'working', startTime: '13:00', endTime: '17:00' },
        { day: 'Mercredi', time: 'Matin', status: 'working', startTime: '08:00', endTime: '12:00' },
        { day: 'Mercredi', time: 'Midi', status: 'break', startTime: '12:00', endTime: '13:00' },
        { day: 'Mercredi', time: 'Après-midi', status: 'working', startTime: '13:00', endTime: '17:00' },
        { day: 'Jeudi', time: 'Matin', status: 'working', startTime: '08:00', endTime: '12:00' },
        { day: 'Jeudi', time: 'Midi', status: 'break', startTime: '12:00', endTime: '13:00' },
        { day: 'Jeudi', time: 'Après-midi', status: 'working', startTime: '13:00', endTime: '17:00' },
        { day: 'Vendredi', time: 'Matin', status: 'working', startTime: '08:00', endTime: '12:00' },
        { day: 'Vendredi', time: 'Midi', status: 'break', startTime: '12:00', endTime: '13:00' },
        { day: 'Vendredi', time: 'Après-midi', status: 'working', startTime: '13:00', endTime: '17:00' }
      ];
      
      weeklySchedules[weekKey] = defaultSchedule;
      localStorage.setItem('weeklySchedules', JSON.stringify(weeklySchedules));
      console.log(`✅ Planning par défaut créé: ${weekKey}`);
      
      // Déclencher les événements de synchronisation
      window.dispatchEvent(new CustomEvent('agentCreated', { 
        detail: { agent: data, storageData: agentStorageData } 
      }));
      window.dispatchEvent(new CustomEvent('planningsUpdated'));
      window.dispatchEvent(new CustomEvent('agentDataUpdated'));
      console.log('✅ Événements de synchronisation déclenchés');
      
      // Reset form
      setCreateFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'employe',
        service: 'medecine',
        hire_date: '',
        specialization: '',
        weeklyHours: 35
      });
      setShowCreateForm(false);
      console.log('✅ Utilisateur créé et synchronisé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setCreateFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'employe',
      service: 'medecine',
      hire_date: '',
      specialization: '',
      weeklyHours: 35
    });
  };

  // Composant de formulaire d'édition
  const EditUserForm = ({ user, onSave, onCancel, saving }: { user: UserWithExtras; onSave: (user: UserWithExtras) => void; onCancel: () => void; saving?: boolean }) => {
    console.log('🎨 RENDU EditUserForm pour:', user.full_name, 'saving:', saving);
    const [formData, setFormData] = useState(user);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log('📝 FORMULAIRE SOUMIS - Données du formulaire:', formData);
      const updatedUser = {
        ...formData,
        rttDays: calculateRTT(formData.weeklyHours || 35)
      };
      console.log('📝 Utilisateur mis à jour à envoyer:', updatedUser);
      console.log('📝 Appel de onSave...');
      onSave(updatedUser);
      console.log('📝 onSave appelé');
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
            <p className="text-sm text-gray-600">
              Modifiez les informations de l'utilisateur et cliquez sur Sauvegarder.
            </p>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              console.log('📋 FORMULAIRE onSubmit déclenché');
              handleSubmit(e);
            }} 
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-name">Nom complet</Label>
                <Input
                  id="edit-name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
                  onValueChange={(value: 'admin' | 'chef_service' | 'employe') => 
                    setFormData({...formData, role: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="chef_service">Chef de Service</SelectItem>
                    <SelectItem value="employe">Employé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-service">Service</Label>
                <Select
                  value={formData.service || ''}
                  onValueChange={(value: 'medecine' | null) => 
                    setFormData({...formData, service: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medecine">Médecine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-hireDate">Date d'embauche</Label>
                <Input
                  id="edit-hireDate"
                  value={formData.hire_date || ''}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
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
                  value={formData.weeklyHours || 35}
                  onChange={(e) => handleHoursChange(parseInt(e.target.value))}
                  required
                />
                <div className="text-sm text-gray-500 mt-1">
                  RTT automatique: {formData.rttDays || 0} jour{(formData.rttDays || 0) > 1 ? 's' : ''}
                  {(formData.weeklyHours || 35) >= 38 && ' (38h = 18 jours RTT)'}
                  {(formData.weeklyHours || 35) === 36 && ' (36h = 6 jours RTT)'}
                  {(formData.weeklyHours || 35) === 35 && ' (35h = 0 jour RTT)'}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                onClick={(e) => {
                  console.log('🖱️ CLIC SUR LE BOUTON SAUVEGARDER');
                  // Ne pas empêcher la soumission du formulaire
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <DatabaseIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Chargement des utilisateurs depuis Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Formulaire d'édition modal */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          saving={saving}
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5 text-blue-600" />
              Gestion des Utilisateurs (Supabase)
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadUsers}
                title="Recharger depuis Supabase"
                className="bg-green-50 text-green-700 hover:bg-green-100"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                🔄 Recharger ({users.length} utilisateurs)
              </Button>
            </div>
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
                <SelectItem value="medecine">Médecine</SelectItem>
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
                    value={createFormData.full_name}
                    onChange={(e) => setCreateFormData({...createFormData, full_name: e.target.value})}
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
                    onValueChange={(value: 'admin' | 'chef_service' | 'employe') => 
                      setCreateFormData({...createFormData, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="chef_service">Chef de Service</SelectItem>
                      <SelectItem value="employe">Employé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={createFormData.service || ''}
                    onValueChange={(value: 'medecine' | null) => 
                      setCreateFormData({...createFormData, service: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medecine">Médecine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hireDate">Date d'embauche</Label>
                  <Input 
                    id="hireDate" 
                    placeholder="Mars 2022"
                    value={createFormData.hire_date}
                    onChange={(e) => setCreateFormData({...createFormData, hire_date: e.target.value})}
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
                <Button onClick={handleCreateUser} disabled={!createFormData.full_name || !createFormData.email}>
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
          <CardTitle className="flex items-center justify-between">
            <span>Liste des Utilisateurs ({filteredUsers.length})</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadUsers}
              title="Recharger la liste des utilisateurs"
            >
              🔄
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-gray-500">{user.phone}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant={user.role === 'employe' ? 'secondary' : 'default'}>
                      {user.role === 'admin' ? 'Admin' : 
                       user.role === 'chef_service' ? 'Chef de Service' : 
                       user.role === 'medecin' ? 'Médecin' :
                       user.role === 'infirmiere' ? 'Infirmière' :
                       user.role === 'dentiste' ? 'Dentiste' :
                       user.role === 'assistante_dentaire' ? 'Assistante dentaire' :
                       user.role === 'rh' ? 'RH' :
                       user.role === 'comptabilite' ? 'Comptabilité' :
                       user.role === 'sage_femme' ? 'Sage-femme' :
                       'Employé'}
                    </Badge>
                    {user.service && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {user.service}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">
                      {user.weeklyHours || 35}h/semaine - {user.rttDays || 0} RTT
                    </span>
                    {user.hire_date && (
                      <span className="text-sm text-gray-500">
                        Depuis {user.hire_date}
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
                    onClick={() => {
                      console.log('🖱️ Clic sur le bouton d\'édition pour:', user.full_name);
                      handleEditUser(user);
                    }}
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
                {users.length === 0 ? (
                  <div className="space-y-4">
                    <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-semibold text-gray-700">Aucun utilisateur dans Supabase</h3>
                    <p className="text-gray-500">
                      Utilisez le panneau de migration ci-dessus pour transférer les données locales vers Supabase.
                    </p>
                  </div>
                ) : (
                  <div>Aucun utilisateur trouvé pour ce service.</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementSupabase;
