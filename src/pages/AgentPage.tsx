import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import AgentProfile from "@/components/AgentProfile";

interface Agent {
  id: string;
  name: string;
  service: string;
  role: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  status?: 'active' | 'inactive';
  weeklyHours?: number;
  rttDays?: number;
  specialization?: string;
  // Nouveaux champs pour les droits de congés
  congésAnnuel?: number;
  heuresFormation?: number;
  enfantMalade?: number;
}

const AgentPage = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAgent = async () => {
      if (!id) {
        setError('ID agent manquant');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Chargement de l\'agent avec ID:', id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Erreur lors du chargement:', error);
          setError('Erreur lors du chargement de l\'agent');
          return;
        }

        if (data) {
          console.log('✅ Agent chargé:', data);
          
          // Charger les données depuis localStorage
          const savedData = localStorage.getItem(`agent_${data.id}_hours`);
          let weeklyHours = 35;
          let rttDays = 0;
          let congésAnnuel = 25;
          let heuresFormation = 40;
          let enfantMalade = 3;
          
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              weeklyHours = parsed.weeklyHours || 35;
              rttDays = parsed.rttDays || 0;
              congésAnnuel = parsed.congésAnnuel || 25;
              heuresFormation = parsed.heuresFormation || 40;
              enfantMalade = parsed.enfantMalade || 3;
            } catch (error) {
              console.error('Erreur lors du parsing des données localStorage:', error);
            }
          }
          
          setAgent({
            id: data.id,
            name: data.full_name,
            service: data.service,
            role: data.role,
            email: data.email,
            phone: data.phone,
            hireDate: data.hire_date,
            weeklyHours,
            rttDays,
            congésAnnuel,
            heuresFormation,
            enfantMalade,
            specialization: 'Agent spécialisé'
          });
        } else {
          setError('Agent non trouvé');
        }
      } catch (error) {
        console.error('❌ Erreur:', error);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadAgent();
  }, [id]);

  const handleClose = () => {
    window.location.href = '/admin-dashboard';
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Agent non trouvé'}</p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return <AgentProfile agent={agent} onClose={handleClose} />;
};

export default AgentPage;