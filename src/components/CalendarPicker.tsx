import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface CalendarPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarPicker = ({ selectedDate, onDateChange }: CalendarPickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    startOfWeek.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 6; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getWeekLabel = (date: Date) => {
    const weekDates = getWeekDates(date);
    const startDate = weekDates[0];
    const endDate = weekDates[5];
    
    return `Semaine du ${formatDate(startDate)} au ${formatDate(endDate)}`;
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToCurrentWeek = () => {
    onDateChange(new Date());
  };

  const weekDates = getWeekDates(selectedDate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sélection de la semaine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
            Semaine précédente
          </Button>
          
          <div className="text-center">
            <h3 className="font-semibold">{getWeekLabel(selectedDate)}</h3>
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek} className="text-sm text-blue-600">
              Cette semaine
            </Button>
          </div>
          
          <Button variant="outline" onClick={goToNextWeek}>
            Semaine suivante
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendrier de la semaine */}
        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
            <div key={day} className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">{day}</div>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                index < 6 ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-gray-100 text-gray-500'
              }`}>
                {weekDates[index]?.getDate()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarPicker;




