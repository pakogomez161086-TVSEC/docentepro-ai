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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      planeaciones: {
        Row: {
          contenido: Json
          created_at: string
          estado: string
          id: string
          proyecto_id: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contenido?: Json
          created_at?: string
          estado?: string
          id?: string
          proyecto_id?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contenido?: Json
          created_at?: string
          estado?: string
          id?: string
          proyecto_id?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planeaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cct: string | null
          created_at: string
          email: string | null
          escuela: string | null
          estado: Database["public"]["Enums"]["account_status"]
          grado: string | null
          id: string
          nombre_completo: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cct?: string | null
          created_at?: string
          email?: string | null
          escuela?: string | null
          estado?: Database["public"]["Enums"]["account_status"]
          grado?: string | null
          id: string
          nombre_completo?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cct?: string | null
          created_at?: string
          email?: string | null
          escuela?: string | null
          estado?: Database["public"]["Enums"]["account_status"]
          grado?: string | null
          id?: string
          nombre_completo?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proyectos: {
        Row: {
          campo_formativo: string
          created_at: string
          disciplina: string
          estado: string
          grado: number
          id: string
          notas: string | null
          ppa: string | null
          producto_integrador: string | null
          proyecto_academico: string | null
          titulo: string
          tomo: number
          trimestre: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campo_formativo: string
          created_at?: string
          disciplina: string
          estado?: string
          grado: number
          id?: string
          notas?: string | null
          ppa?: string | null
          producto_integrador?: string | null
          proyecto_academico?: string | null
          titulo: string
          tomo: number
          trimestre?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campo_formativo?: string
          created_at?: string
          disciplina?: string
          estado?: string
          grado?: number
          id?: string
          notas?: string | null
          ppa?: string | null
          producto_integrador?: string | null
          proyecto_academico?: string | null
          titulo?: string
          tomo?: number
          trimestre?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sesiones: {
        Row: {
          cierre: string | null
          created_at: string
          desarrollo: string | null
          duracion_min: number | null
          evaluacion: string | null
          id: string
          inicio: string | null
          materiales: string | null
          numero: number
          planeacion_id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cierre?: string | null
          created_at?: string
          desarrollo?: string | null
          duracion_min?: number | null
          evaluacion?: string | null
          id?: string
          inicio?: string | null
          materiales?: string | null
          numero: number
          planeacion_id: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cierre?: string | null
          created_at?: string
          desarrollo?: string | null
          duracion_min?: number | null
          evaluacion?: string | null
          id?: string
          inicio?: string | null
          materiales?: string | null
          numero?: number
          planeacion_id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_planeacion_id_fkey"
            columns: ["planeacion_id"]
            isOneToOne: false
            referencedRelation: "planeaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "activo" | "inactivo" | "suspendido"
      app_role: "administrador" | "docente" | "suscriptor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["activo", "inactivo", "suspendido"],
      app_role: ["administrador", "docente", "suscriptor"],
    },
  },
} as const
