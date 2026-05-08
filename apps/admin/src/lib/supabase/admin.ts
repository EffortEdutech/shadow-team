import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ConnectorDatabase = {
  public: {
    Tables: {
      products: {
        Row: { id: string; slug: string };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      contact_profiles: {
        Row: { id: string; external_id: string | null };
        Insert: {
          external_id?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          primary_product_id?: string | null;
          metadata_json?: Json;
        };
        Update: {
          external_id?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company_name?: string | null;
          primary_product_id?: string | null;
          metadata_json?: Json;
        };
        Relationships: [];
      };
      conversations: {
        Row: { id: string };
        Insert: {
          product_id?: string | null;
          channel?: string;
          contact_profile_id?: string | null;
          status?: string;
          priority?: string;
          ai_status?: string;
          subject?: string | null;
          last_message_preview?: string | null;
          last_message_at?: string | null;
          metadata_json?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      messages: {
        Row: { id: string };
        Insert: {
          conversation_id: string;
          sender_type: string;
          content: string;
          visibility?: string;
          channel_message_id?: string | null;
          metadata_json?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      audit_events: {
        Row: { id: string };
        Insert: {
          product_id?: string | null;
          actor_type: string;
          event_type: string;
          entity_type: string;
          entity_id?: string | null;
          metadata_json?: Json;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let adminClient: SupabaseClient<ConnectorDatabase> | null = null;

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient<ConnectorDatabase>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
