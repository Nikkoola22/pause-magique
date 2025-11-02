import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface LeaveRequest {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  hours: string;
  motif: string;
  status: 'pending' | 'approved' | 'rejected';
  startTime?: string; // Pour RTT : heure de début (ex: "09:00")
  endTime?: string;   // Pour RTT : heure de fin (ex: "17:00")
}

interface LeaveRequestFormProps {
  onSubmit: (request: Omit<LeaveRequest, 'id'>) => void;
}

const LEAVE_TYPES = [
  { value: "CA", label: "Congés Annuels (CA)" },
  { value: "CF", label: "Congés de Formation (CF)" },
  { value: "CM", label: "Congés Maladie (CM)" },
  { value: "RTT", label: "RTT" },
  { value: "HS", label: "Heures Supplémentaires" },
  { value: "ASA", label: "ASA" },
  { value: "CB", label: "Congés de Bonification" }
];

export function LeaveRequestForm({ onSubmit }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [hours, setHours] = useState("");
  const [motif, setMotif] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveType || !startDate || !endDate) {
      return;
    }

    const request: Omit<LeaveRequest, 'id'> = {
      type: leaveType,
      startDate,
      endDate,
      hours: hours || "7:30:00",
      motif,
      status: 'pending'
    };

    // Ajouter les heures pour RTT
    if (leaveType === "RTT") {
      if (startTime) request.startTime = startTime;
      if (endTime) request.endTime = endTime;
    }

    onSubmit(request);

    // Reset form
    setLeaveType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setHours("");
    setMotif("");
    setStartTime("");
    setEndTime("");
  };

  return (
    <Card className="bg-card shadow-lg border-border">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90">
        <CardTitle className="flex items-center gap-2 text-primary-foreground">
          <Plus className="w-5 h-5" />
          Nouvelle Demande de Congé
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="leave-type">Type de congé</Label>
              <Select value={leaveType} onValueChange={setLeaveType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Durée (heures)</Label>
              <Input
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ex: 7:30:00"
              />
            </div>
          </div>

          {/* Champs horaires pour RTT */}
          {leaveType === "RTT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="start-time">Heure de début</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="09:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Heure de fin</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="17:00"
                />
              </div>
              <p className="col-span-full text-xs text-gray-600">
                Optionnel : Spécifiez un créneau horaire pour le RTT
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: fr }) : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: fr }) : "Choisir une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">Motif (optionnel)</Label>
            <Input
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Raison de la demande..."
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            disabled={!leaveType || !startDate || !endDate}
          >
            Soumettre la demande
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}