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
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          label: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          label: string
          owner_id: string
          sections: Json
          version: number
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          label?: string
          owner_id: string
          sections?: Json
          version: number
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          label?: string
          owner_id?: string
          sections?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          project_id: string
          sections: Json
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          project_id: string
          sections?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          project_id?: string
          sections?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      export_jobs: {
        Row: {
          created_at: string
          document_id: string
          error_message: string | null
          file_url: string | null
          format: string
          id: string
          owner_id: string
          status: string
        }
        Insert: {
          created_at?: string
          document_id: string
          error_message?: string | null
          file_url?: string | null
          format: string
          id?: string
          owner_id: string
          status?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          error_message?: string | null
          file_url?: string | null
          format?: string
          id?: string
          owner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          suspended: boolean
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          brief: Json
          created_at: string
          description: string
          id: string
          owner_id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          brief?: Json
          created_at?: string
          description?: string
          id?: string
          owner_id: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          brief?: Json
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      source_files: {
        Row: {
          created_at: string
          description: string
          extracted_text: string
          file_name: string
          id: string
          owner_id: string
          project_id: string
          size_bytes: number
          status: string
          storage_path: string | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string
          extracted_text?: string
          file_name: string
          id?: string
          owner_id: string
          project_id: string
          size_bytes?: number
          status?: string
          storage_path?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          description?: string
          extracted_text?: string
          file_name?: string
          id?: string
          owner_id?: string
          project_id?: string
          size_bytes?: number
          status?: string
          storage_path?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          ai_model: string
          ai_provider: string
          created_at: string
          credit_price: number
          id: string
          tokens_per_credit: number
          updated_at: string
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          created_at?: string
          credit_price?: number
          id?: string
          tokens_per_credit?: number
          updated_at?: string
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          created_at?: string
          credit_price?: number
          id?: string
          tokens_per_credit?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_settings_history: {
        Row: {
          changed_by: string | null
          changed_by_email: string
          created_at: string
          id: string
          new_value: string
          old_value: string
          setting_key: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string
          created_at?: string
          id?: string
          new_value?: string
          old_value?: string
          setting_key: string
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string
          created_at?: string
          id?: string
          new_value?: string
          old_value?: string
          setting_key?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role: "user" | "admin"
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
      app_role: ["user", "admin"],
    },
  },
} as const
