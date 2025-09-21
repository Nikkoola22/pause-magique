import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";

interface ScheduleSlot {
  day: string;
  time: string;
  status: 'working' | 'break' | 'off';
  startTime?: string;
  endTime?: string;
}

interface ReadOnlyScheduleProps {
  agentName: string;
  weekLabel: string;
  schedule: ScheduleSlot[];
  isConfirmed?: boolean;
}

const ReadOnlySchedule = ({ agentName, weekLabel, schedule, isConfirmed = true }: ReadOnlyScheduleProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800 border-green-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'off': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'working': return 'Présent';
      case 'break': return 'Pause';
      case 'off': return 'Absent';
      default: return 'Non défini';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return '✅';
      case 'break': return '☕';
      case 'off': return '❌';
      default: return '❓';
    }
  };

  // Calculer le nombre d'heures réelles effectuées dans la semaine
  const calculateTotalWorkingHours = () => {
    if (!schedule || schedule.length === 0) return 0;
    
    let totalMinutes = 0;
    
    schedule.forEach(slot => {
      // Ne compter que les créneaux "working" (présent)
      if (slot.status === 'working' && slot.startTime && slot.endTime) {
        const start = slot.startTime.split(':');
        const end = slot.endTime.split(':');
        
        const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
        const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
        
        const durationMinutes = endMinutes - startMinutes;
        totalMinutes += durationMinutes;
      }
    });
    
    // Convertir en heures (arrondi à 0.5h près)
    const totalHours = totalMinutes / 60;
    return Math.round(totalHours * 2) / 2; // Arrondi à 0.5h près
  };

  // Structure des créneaux par jour
  const getTimeSlotsForDay = (day: string) => {
    if (day !== 'Samedi') {
      const matinSlot = schedule.find(s => s.day === day && s.time === 'Matin');
      const midiSlot = schedule.find(s => s.day === day && s.time === 'Midi');
      const apresMidiSlot = schedule.find(s => s.day === day && s.time === 'Après-midi');
      
      return [
        { 
          time: 'Matin', 
          status: matinSlot?.status || 'working',
          startTime: matinSlot?.startTime || '08:00',
          endTime: matinSlot?.endTime || '12:00'
        },
        { 
          time: 'Midi', 
          status: midiSlot?.status || 'break',
          startTime: midiSlot?.startTime || '12:00',
          endTime: midiSlot?.endTime || '13:00'
        },
        { 
          time: 'Après-midi', 
          status: apresMidiSlot?.status || 'working',
          startTime: apresMidiSlot?.startTime || '13:00',
          endTime: apresMidiSlot?.endTime || '17:00'
        }
      ];
    } else {
      const matinSlot = schedule.find(s => s.day === day && s.time === 'Matin');
      return [
        { 
          time: 'Matin', 
          status: matinSlot?.status || 'working',
          startTime: matinSlot?.startTime || '08:00',
          endTime: matinSlot?.endTime || '13:00'
        }
      ];
    }
  };

  return (
    <Card className={isConfirmed ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning confirmé
            <span className="text-sm text-gray-600 font-normal">
              ({calculateTotalWorkingHours()}h effectuées)
            </span>
          </div>
          {isConfirmed && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              ✓ Confirmé
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{agentName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{weekLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grille du planning en lecture seule */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left font-semibold">Jour</th>
                <th className="border border-gray-300 p-3 text-center font-semibold">Matin</th>
                <th className="border border-gray-300 p-3 text-center font-semibold">Midi</th>
                <th className="border border-gray-300 p-3 text-center font-semibold">Après-midi</th>
              </tr>
            </thead>
            <tbody>
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => {
                const daySlots = getTimeSlotsForDay(day);
                return (
                  <tr key={day} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium bg-gray-50">
                      {day}
                    </td>
                    {day !== 'Samedi' ? (
                      <>
                        <td className="border border-gray-300 p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500 mb-1">
                              {daySlots[0].startTime}-{daySlots[0].endTime}
                            </span>
                            <span className="text-lg">{getStatusIcon(daySlots[0].status)}</span>
                            <Badge className={`${getStatusColor(daySlots[0].status)} text-xs`}>
                              {getStatusLabel(daySlots[0].status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500 mb-1">
                              {daySlots[1].startTime}-{daySlots[1].endTime}
                            </span>
                            <span className="text-lg">{getStatusIcon(daySlots[1].status)}</span>
                            <Badge className={`${getStatusColor(daySlots[1].status)} text-xs`}>
                              {getStatusLabel(daySlots[1].status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500 mb-1">
                              {daySlots[2].startTime}-{daySlots[2].endTime}
                            </span>
                            <span className="text-lg">{getStatusIcon(daySlots[2].status)}</span>
                            <Badge className={`${getStatusColor(daySlots[2].status)} text-xs`}>
                              {getStatusLabel(daySlots[2].status)}
                            </Badge>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-300 p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500 mb-1">
                              {daySlots[0].startTime}-{daySlots[0].endTime}
                            </span>
                            <span className="text-lg">{getStatusIcon(daySlots[0].status)}</span>
                            <Badge className={`${getStatusColor(daySlots[0].status)} text-xs`}>
                              {getStatusLabel(daySlots[0].status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center bg-gray-100">
                          <span className="text-gray-500 text-sm">-</span>
                        </td>
                        <td className="border border-gray-300 p-3 text-center bg-gray-100">
                          <span className="text-gray-500 text-sm">-</span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Légende */}
        <div className="flex justify-center gap-6 p-4 bg-white rounded-lg mt-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="text-sm text-gray-700">Présent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">☕</span>
            <span className="text-sm text-gray-700">Pause</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span className="text-sm text-gray-700">Absent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadOnlySchedule;
