/**
 * Utilitaires pour gérer les demandes de congé et leur impact sur les plannings
 */

export interface ScheduleSlot {
  day: string;
  time: string;
  status: 'working' | 'break' | 'off';
  startTime?: string;
  endTime?: string;
}

export interface LeaveRequest {
  id: string;
  employee_name: string;
  agent_id?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  rtt_hours?: number;
  start_time?: string;
  end_time?: string;
  reason?: string;
  status: 'en_attente' | 'approuve' | 'refuse';
  created_at: string;
}

/**
 * Retourne le jour de la semaine en français pour une date donnée
 */
export function getDayNameFr(date: Date): string | null {
  const dayOfWeek = date.getDay();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return dayNames[dayOfWeek] || null;
}

/**
 * Génère la clé de planning pour un agent et une date
 */
export function getScheduleKey(agentId: string, date: Date): string {
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + daysToMonday);
  
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, '0');
  const day = String(weekStart.getDate()).padStart(2, '0');
  return `${agentId}_${year}-${month}-${day}`;
}

/**
 * Met à jour le planning de l'agent avec les jours de congé
 * Marque les jours concernés comme 'off' (absent)
 */
export function updateScheduleWithLeave(
  agentId: string,
  leave: LeaveRequest,
  currentSchedules: { [key: string]: ScheduleSlot[] }
): { [key: string]: ScheduleSlot[] } {
  const updatedSchedules = { ...currentSchedules };
  
  // Parser les dates correctement (éviter les problèmes de timezone)
  const [startYear, startMonth, startDay] = leave.start_date.split('-').map(Number);
  const [endYear, endMonth, endDay] = leave.end_date.split('-').map(Number);
  
  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);
  
  console.log('📅 Parcours des jours de congé:', {
    start: leave.start_date,
    end: leave.end_date,
    startDate: startDate.toLocaleDateString('fr-FR'),
    endDate: endDate.toLocaleDateString('fr-FR')
  });
  
  // Parcourir chaque jour du congé
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayName = getDayNameFr(currentDate);
    
    console.log(`  📍 Date: ${currentDate.toLocaleDateString('fr-FR')}, Jour: ${dayName}`);
    
    if (dayName && dayName !== 'Dimanche') {
      // Obtenir la clé de planning pour cette semaine
      const weekKey = getScheduleKey(agentId, currentDate);
      
      console.log(`    → Clé planning: ${weekKey}`);
      
      // Si le planning de cette semaine n'existe pas, le créer avec des valeurs par défaut
      if (!updatedSchedules[weekKey]) {
        console.log(`    → Planning créé par défaut`);
        updatedSchedules[weekKey] = generateDefaultSchedule();
      }
      
      const schedule = updatedSchedules[weekKey];
      
      // Mettre à jour tous les créneaux du jour avec le statut 'off'
      const updatedSchedule = schedule.map(slot => {
        if (slot.day === dayName) {
          console.log(`    → Créneau '${dayName} ${slot.time}' → OFF`);
          return { ...slot, status: 'off' as const };
        }
        return slot;
      });
      
      updatedSchedules[weekKey] = updatedSchedule;
    } else if (dayName === 'Dimanche') {
      console.log(`  ⏭️ Dimanche ignoré`);
    }
    
    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return updatedSchedules;
}

/**
 * Génère un planning par défaut (semaine complète)
 */
export function generateDefaultSchedule(): ScheduleSlot[] {
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const schedule: ScheduleSlot[] = [];
  
  for (const day of days) {
    if (day !== 'Samedi') {
      schedule.push(
        { day, time: 'Matin', status: 'working', startTime: '08:00', endTime: '12:00' },
        { day, time: 'Midi', status: 'break', startTime: '12:00', endTime: '13:00' },
        { day, time: 'Après-midi', status: 'working', startTime: '13:00', endTime: '17:00' }
      );
    } else {
      schedule.push(
        { day, time: 'Matin', status: 'working', startTime: '08:00', endTime: '13:00' }
      );
    }
  }
  
  return schedule;
}

/**
 * Sauvegarde les plannings mis à jour dans localStorage
 */
export function saveSchedules(schedules: { [key: string]: ScheduleSlot[] }): void {
  localStorage.setItem('weeklySchedules', JSON.stringify(schedules));
  console.log('✅ Plannings sauvegardés avec les congés appliqués');
  
  // Déclencher un événement pour notifier les composants
  window.dispatchEvent(new CustomEvent('planningsUpdatedWithLeave', {
    detail: { schedules }
  }));
}

/**
 * Applique une demande de congé approuvée au planning et le sauvegarde
 */
export function applyLeaveToSchedule(
  agentId: string,
  leave: LeaveRequest,
  currentSchedules: { [key: string]: ScheduleSlot[] }
): { [key: string]: ScheduleSlot[] } {
  if (leave.status !== 'approuve') {
    console.warn('⚠️ La demande de congé n\'est pas approuvée');
    return currentSchedules;
  }
  
  console.log('📅 Application du congé au planning:', {
    agentId,
    leave_type: leave.leave_type,
    start_date: leave.start_date,
    end_date: leave.end_date
  });
  
  const updatedSchedules = updateScheduleWithLeave(agentId, leave, currentSchedules);
  saveSchedules(updatedSchedules);
  
  return updatedSchedules;
}

/**
 * Annule un congé du planning (remet le jour en 'working')
 */
export function cancelLeaveFromSchedule(
  agentId: string,
  leave: LeaveRequest,
  currentSchedules: { [key: string]: ScheduleSlot[] }
): { [key: string]: ScheduleSlot[] } {
  const updatedSchedules = { ...currentSchedules };
  
  // Parser les dates correctement (éviter les problèmes de timezone)
  const [startYear, startMonth, startDay] = leave.start_date.split('-').map(Number);
  const [endYear, endMonth, endDay] = leave.end_date.split('-').map(Number);
  
  const startDate = new Date(startYear, startMonth - 1, startDay);
  const endDate = new Date(endYear, endMonth - 1, endDay);
  
  // Parcourir chaque jour du congé
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayName = getDayNameFr(currentDate);
    
    if (dayName && dayName !== 'Dimanche') {
      const weekKey = getScheduleKey(agentId, currentDate);
      
      if (!updatedSchedules[weekKey]) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      const schedule = updatedSchedules[weekKey];
      
      // Remettre tous les créneaux du jour en 'working'
      const updatedSchedule = schedule.map(slot => {
        if (slot.day === dayName && slot.status === 'off') {
          return { ...slot, status: 'working' as const };
        }
        return slot;
      });
      
      updatedSchedules[weekKey] = updatedSchedule;
    }
    
    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  saveSchedules(updatedSchedules);
  
  return updatedSchedules;
}
