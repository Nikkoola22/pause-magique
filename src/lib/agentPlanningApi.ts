// Table: agent_plannings
// Columns: id (uuid, pk), agent_id (text), week (text), planning (jsonb), updated_at (timestamp)

import { supabase } from '../lib/supabaseClient';

export async function saveAgentPlanning(agentId: string, week: string, planning: any) {
  try {
    console.log('💾 Tentative de sauvegarde Supabase:', { agentId, week, planningLength: planning?.length });
    
    // Utiliser la syntaxe correcte de Supabase v2
    const { data, error } = await supabase
      .from('agent_plannings')
      .upsert(
        { agent_id: agentId, week, planning, updated_at: new Date().toISOString() },
        { onConflict: 'agent_id,week' }
      );
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return { data: null, error };
    }
    
    console.log('✅ Planning sauvegardé avec succès:', data);
    return { data, error: null };
  } catch (err) {
    console.error('❌ Exception lors de la sauvegarde:', err);
    return { data: null, error: err };
  }
}

export async function getAgentPlanning(agentId: string, week: string) {
  const { data, error } = await supabase
    .from('agent_plannings')
    .select('planning')
    .eq('agent_id', agentId)
    .eq('week', week)
    .single();
  return { data, error };
}

export async function getAllAgentPlannings(agentId: string) {
  const { data, error } = await supabase
    .from('agent_plannings')
    .select('week, planning')
    .eq('agent_id', agentId);
  return { data, error };
}
