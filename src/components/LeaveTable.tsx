import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Edit2, Check, X, Calendar, Clock } from "lucide-react";
import { LeaveRequest } from "./LeaveRequestForm";

interface EmployeeInfo {
  name: string;
  firstName: string;
  seniority: string;
  yearEntry: number;
  contractStart: string;
  contractEnd: string;
  workQuota: number;
}

interface LeaveTableProps {
  employee: EmployeeInfo;
  leaveRequests: LeaveRequest[];
  onUpdateRequest: (id: string, updatedRequest: Partial<LeaveRequest>) => void;
  onDeleteRequest: (id: string) => void;
}

export function LeaveTable({ employee, leaveRequests, onUpdateRequest, onDeleteRequest }: LeaveTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<LeaveRequest>>({});

  const handleEdit = (request: LeaveRequest) => {
    setEditingId(request.id);
    setEditValues(request);
  };

  const handleSave = () => {
    if (editingId && editValues) {
      onUpdateRequest(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    const variants = {
      pending: "bg-warning text-warning-foreground",
      approved: "bg-success text-success-foreground", 
      rejected: "bg-destructive text-destructive-foreground"
    };

    const labels = {
      pending: "En attente",
      approved: "Approuvé",
      rejected: "Refusé"
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const totalHours = leaveRequests
    .filter(req => req.status === 'approved')
    .reduce((total, req) => {
      const [hours, minutes] = req.hours.split(':').map(Number);
      return total + (hours * 60 + minutes);
    }, 0);

  const formatTotalHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Employee Info Card */}
      <Card className="bg-admin-header text-admin-header-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Récapitulatif Congés - Année 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Nom:</strong> {employee.name} {employee.firstName}
            </div>
            <div>
              <strong>Ancienneté:</strong> {employee.seniority}
            </div>
            <div>
              <strong>Année d'entrée FP:</strong> {employee.yearEntry}
            </div>
            <div>
              <strong>Début contrat:</strong> {employee.contractStart}
            </div>
            <div>
              <strong>Fin contrat:</strong> {employee.contractEnd}
            </div>
            <div>
              <strong>Quotité:</strong> {employee.workQuota}h
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-success/10 to-success/5 border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-success" />
              <span className="font-semibold">Total heures prises:</span>
            </div>
            <span className="text-lg font-bold text-success">
              {formatTotalHours(totalHours)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader className="bg-table-header">
          <CardTitle>Dates d'absence et motifs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead>Type</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Plage horaire</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request, index) => (
                  <TableRow 
                    key={request.id} 
                    className={index % 2 === 0 ? "bg-table-row-even" : "bg-table-row-odd"}
                  >
                    <TableCell className="font-medium">{request.type}</TableCell>
                    <TableCell>
                      {editingId === request.id ? (
                        <Input
                          type="date"
                          value={editValues.startDate ? format(editValues.startDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setEditValues({ 
                            ...editValues, 
                            startDate: new Date(e.target.value) 
                          })}
                          className="w-full"
                        />
                      ) : (
                        format(request.startDate, 'PPP', { locale: fr })
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === request.id ? (
                        <Input
                          type="date"
                          value={editValues.endDate ? format(editValues.endDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setEditValues({ 
                            ...editValues, 
                            endDate: new Date(e.target.value) 
                          })}
                          className="w-full"
                        />
                      ) : (
                        format(request.endDate, 'PPP', { locale: fr })
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === request.id ? (
                        <Input
                          value={editValues.hours || ''}
                          onChange={(e) => setEditValues({ 
                            ...editValues, 
                            hours: e.target.value 
                          })}
                          className="w-20"
                        />
                      ) : (
                        request.hours
                      )}
                    </TableCell>
                    <TableCell>
                      {request.type === 'RTT' ? (
                        editingId === request.id ? (
                          <div className="flex gap-2">
                            <Input
                              type="time"
                              value={editValues.startTime || ''}
                              onChange={(e) => setEditValues({ 
                                ...editValues, 
                                startTime: e.target.value 
                              })}
                              className="w-24"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={editValues.endTime || ''}
                              onChange={(e) => setEditValues({ 
                                ...editValues, 
                                endTime: e.target.value 
                              })}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          <span className="text-sm">
                            {request.startTime && request.endTime 
                              ? `${request.startTime} - ${request.endTime}`
                              : '-'
                            }
                          </span>
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === request.id ? (
                        <Input
                          value={editValues.motif || ''}
                          onChange={(e) => setEditValues({ 
                            ...editValues, 
                            motif: e.target.value 
                          })}
                          className="w-full"
                        />
                      ) : (
                        request.motif || '-'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingId === request.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSave}
                              className="h-8 w-8 p-0 text-success hover:bg-success/10"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(request)}
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteRequest(request.id)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {leaveRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune demande de congé enregistrée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}