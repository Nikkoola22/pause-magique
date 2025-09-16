import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, ArrowLeft, Users } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  firstName: string;
}

interface NavigationProps {
  employees: Employee[];
  showBackButton?: boolean;
}

export function Navigation({ employees, showBackButton = false }: NavigationProps) {
  const { id } = useParams();
  const currentEmployeeId = id ? parseInt(id) : null;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link to="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Tableau de bord
                </Button>
              </Link>
            )}
            
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">Agents :</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {employees.map((employee) => (
              <Link key={employee.id} to={`/agent/${employee.id}`}>
                <Button
                  variant={currentEmployeeId === employee.id ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {employee.firstName} {employee.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}