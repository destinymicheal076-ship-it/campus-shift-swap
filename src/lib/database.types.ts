// Matches supabase/migrations/. Once your project is linked, regenerate with
//   npm run db:types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; created_at: string };
        Insert: { id: string; full_name?: string; created_at?: string };
        Update: { id?: string; full_name?: string; created_at?: string };
        Relationships: [];
      };
      workplaces: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
        Relationships: [];
      };
      roles: {
        Row: { id: string; workplace_id: string; name: string };
        Insert: { id?: string; workplace_id: string; name: string };
        Update: { id?: string; workplace_id?: string; name?: string };
        Relationships: [
          {
            foreignKeyName: "roles_workplace_id_fkey";
            columns: ["workplace_id"];
            isOneToOne: false;
            referencedRelation: "workplaces";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: { user_id: string; workplace_id: string; is_supervisor: boolean };
        Insert: { user_id: string; workplace_id: string; is_supervisor?: boolean };
        Update: { user_id?: string; workplace_id?: string; is_supervisor?: boolean };
        Relationships: [
          {
            foreignKeyName: "memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_workplace_id_fkey";
            columns: ["workplace_id"];
            isOneToOne: false;
            referencedRelation: "workplaces";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: { user_id: string; role_id: string };
        Insert: { user_id: string; role_id: string };
        Update: { user_id?: string; role_id?: string };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      shifts: {
        Row: {
          id: string;
          workplace_id: string;
          role_id: string;
          starts_at: string;
          ends_at: string;
          assignee_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workplace_id: string;
          role_id: string;
          starts_at: string;
          ends_at: string;
          assignee_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workplace_id?: string;
          role_id?: string;
          starts_at?: string;
          ends_at?: string;
          assignee_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_workplace_id_fkey";
            columns: ["workplace_id"];
            isOneToOne: false;
            referencedRelation: "workplaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shifts_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      swap_requests: {
        Row: {
          id: string;
          shift_id: string;
          requester_id: string;
          claimer_id: string | null;
          status: Database["public"]["Enums"]["swap_status"];
          note: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          shift_id: string;
          requester_id: string;
          claimer_id?: string | null;
          status?: Database["public"]["Enums"]["swap_status"];
          note?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          shift_id?: string;
          requester_id?: string;
          claimer_id?: string | null;
          status?: Database["public"]["Enums"]["swap_status"];
          note?: string | null;
          created_at?: string;
          decided_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "swap_requests_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "swap_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "swap_requests_claimer_id_fkey";
            columns: ["claimer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_member: { Args: { wp: string }; Returns: boolean };
      is_supervisor: { Args: { wp: string }; Returns: boolean };
      shares_workplace: { Args: { other: string }; Returns: boolean };
      shift_workplace: { Args: { shift: string }; Returns: string };
      role_workplace: { Args: { role: string }; Returns: string };
    };
    Enums: {
      swap_status: "open" | "pending" | "approved" | "denied" | "cancelled";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
