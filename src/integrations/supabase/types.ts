export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      administrators: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          contract_type: string | null
          created_at: string | null
          department: string | null
          employee_number: string
          id: string
          manager_id: string | null
          position: string
          profile_id: string | null
          salary: number | null
          updated_at: string | null
          work_hours_per_week: number | null
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          department?: string | null
          employee_number: string
          id?: string
          manager_id?: string | null
          position: string
          profile_id?: string | null
          salary?: number | null
          updated_at?: string | null
          work_hours_per_week?: number | null
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          department?: string | null
          employee_number?: string
          id?: string
          manager_id?: string | null
          position?: string
          profile_id?: string | null
          salary?: number | null
          updated_at?: string | null
          work_hours_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          comments: string | null
          created_at: string | null
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string | null
          days_count: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          comments?: string | null
          created_at?: string | null
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          employee_id: string
          id: string
          priority: number | null
          status: Database["public"]["Enums"]["onboarding_status"] | null
          task_description: string | null
          task_title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          priority?: number | null
          status?: Database["public"]["Enums"]["onboarding_status"] | null
          task_description?: string | null
          task_title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          priority?: number | null
          status?: Database["public"]["Enums"]["onboarding_status"] | null
          task_description?: string | null
          task_title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          hire_date: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          service: Database["public"]["Enums"]["service_type"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          hire_date?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      time_tracking: {
        Row: {
          break_duration: number | null
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          notes: string | null
          overtime_hours: number | null
          total_hours: number | null
          updated_at: string | null
        }
        Insert: {
          break_duration?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          break_duration?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          total_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          employee_id: string
          enrollment_date: string | null
          id: string
          score: number | null
          status: string | null
          training_id: string
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          employee_id: string
          enrollment_date?: string | null
          id?: string
          score?: number | null
          status?: string | null
          training_id: string
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          employee_id?: string
          enrollment_date?: string | null
          id?: string
          score?: number | null
          status?: string | null
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          created_at: string | null
          description: string | null
          duration_hours: number | null
          end_date: string | null
          id: string
          instructor: string | null
          location: string | null
          max_participants: number | null
          service: Database["public"]["Enums"]["service_type"] | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          instructor?: string | null
          location?: string | null
          max_participants?: number | null
          service?: Database["public"]["Enums"]["service_type"] | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          end_date?: string | null
          id?: string
          instructor?: string | null
          location?: string | null
          max_participants?: number | null
          service?: Database["public"]["Enums"]["service_type"] | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      leave_status: "en_attente" | "approuve" | "refuse"
      onboarding_status: "non_commence" | "en_cours" | "termine"
      service_type: "medecine" | "dentaire" | "radiologie"
      user_role: "admin" | "chef_service" | "employe"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      leave_status: ["en_attente", "approuve", "refuse"],
      onboarding_status: ["non_commence", "en_cours", "termine"],
      service_type: ["medecine", "dentaire", "radiologie"],
      user_role: ["admin", "chef_service", "employe"],
    },
  },
} as const
