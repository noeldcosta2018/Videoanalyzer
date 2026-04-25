// Auto-generated types — run `supabase gen types typescript --local > src/types/supabase.ts`
// after running `supabase db reset` against a local dev instance.
// This stub satisfies the TypeScript compiler until then.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          tier: "free" | "pro" | "team";
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          tier?: "free" | "pro" | "team";
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      notebooks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          youtube_url: string | null;
          status: "pending" | "processing" | "ready" | "failed";
          shared_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          youtube_url?: string | null;
          status?: "pending" | "processing" | "ready" | "failed";
          shared_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notebooks"]["Insert"]>;
      };
      sources: {
        Row: {
          id: string;
          notebook_id: string;
          kind: "youtube_url" | "upload_video" | "upload_pdf" | "url" | "note";
          url: string | null;
          r2_key: string | null;
          duration_seconds: number | null;
          language: string | null;
          status: "pending" | "processing" | "ready" | "failed";
          gemini_response_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          notebook_id: string;
          kind: "youtube_url" | "upload_video" | "upload_pdf" | "url" | "note";
          url?: string | null;
          r2_key?: string | null;
          duration_seconds?: number | null;
          language?: string | null;
          status?: "pending" | "processing" | "ready" | "failed";
          gemini_response_json?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sources"]["Insert"]>;
      };
      artifacts: {
        Row: {
          id: string;
          notebook_id: string;
          source_id: string | null;
          kind:
            | "summary"
            | "detailed"
            | "mind_map"
            | "slide_deck"
            | "code_pack"
            | "diagram_pack"
            | "audio_overview"
            | "video_overview"
            | "recall_pack"
            | "action_list"
            | "short_clips"
            | "critical_viewing";
          status: "pending" | "processing" | "ready" | "failed";
          payload_json: Json | null;
          r2_keys: Json | null;
          tier_used: "free" | "pro" | null;
          cost_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          notebook_id: string;
          source_id?: string | null;
          kind: Database["public"]["Tables"]["artifacts"]["Row"]["kind"];
          status?: "pending" | "processing" | "ready" | "failed";
          payload_json?: Json | null;
          r2_keys?: Json | null;
          tier_used?: "free" | "pro" | null;
          cost_cents?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["artifacts"]["Insert"]>;
      };
      chunks: {
        Row: {
          id: string;
          source_id: string;
          notebook_id: string;
          content: string;
          embedding: number[] | null;
          start_sec: number | null;
          page_num: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          notebook_id: string;
          content: string;
          embedding?: number[] | null;
          start_sec?: number | null;
          page_num?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chunks"]["Insert"]>;
      };
      usage_meter: {
        Row: {
          id: string;
          user_id: string;
          event: "video_processed" | "artifact_generated" | "export" | "clip_export";
          video_minutes: number | null;
          cost_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event: "video_processed" | "artifact_generated" | "export" | "clip_export";
          video_minutes?: number | null;
          cost_cents?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usage_meter"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
