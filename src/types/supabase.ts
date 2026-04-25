// Hand-written stub — replace with `supabase gen types typescript --linked` once CLI is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Row<T> = T;
type Nullable<T> = T | null;

interface ProfileRow {
  id: string;
  email: Nullable<string>;
  tier: "free" | "pro" | "team";
  stripe_customer_id: Nullable<string>;
  created_at: string;
  updated_at: string;
}

interface NotebookRow {
  id: string;
  user_id: string;
  title: string;
  youtube_url: Nullable<string>;
  status: "pending" | "processing" | "ready" | "failed";
  shared_token: Nullable<string>;
  created_at: string;
  updated_at: string;
}

interface SourceRow {
  id: string;
  notebook_id: string;
  kind: "youtube_url" | "upload_video" | "upload_pdf" | "url" | "note";
  url: Nullable<string>;
  r2_key: Nullable<string>;
  duration_seconds: Nullable<number>;
  language: Nullable<string>;
  status: "pending" | "processing" | "ready" | "failed";
  gemini_response_json: Nullable<Json>;
  created_at: string;
}

interface ArtifactRow {
  id: string;
  notebook_id: string;
  source_id: Nullable<string>;
  kind:
    | "summary" | "detailed" | "mind_map" | "slide_deck" | "code_pack"
    | "diagram_pack" | "audio_overview" | "video_overview" | "recall_pack"
    | "action_list" | "short_clips" | "critical_viewing";
  status: "pending" | "processing" | "ready" | "failed";
  payload_json: Nullable<Json>;
  r2_keys: Nullable<Json>;
  tier_used: Nullable<"free" | "pro">;
  cost_cents: number;
  created_at: string;
}

interface ChunkRow {
  id: string;
  source_id: string;
  notebook_id: string;
  content: string;
  embedding: Nullable<number[]>;
  start_sec: Nullable<number>;
  page_num: Nullable<number>;
  created_at: string;
}

interface UsageMeterRow {
  id: string;
  user_id: string;
  event: "video_processed" | "artifact_generated" | "export" | "clip_export";
  video_minutes: Nullable<number>;
  cost_cents: number;
  created_at: string;
}

function makeTable<R, I extends Partial<R>, U extends Partial<R>>() {
  return {} as {
    Row: Row<R>;
    Insert: I;
    Update: U;
    Relationships: [];
  };
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      notebooks: {
        Row: NotebookRow;
        Insert: { user_id: string; title?: string; youtube_url?: Nullable<string>; status?: NotebookRow["status"]; shared_token?: Nullable<string>; created_at?: string; updated_at?: string };
        Update: Partial<NotebookRow>;
        Relationships: [];
      };
      sources: {
        Row: SourceRow;
        Insert: { notebook_id: string; kind: SourceRow["kind"]; url?: Nullable<string>; r2_key?: Nullable<string>; duration_seconds?: Nullable<number>; language?: Nullable<string>; status?: SourceRow["status"]; gemini_response_json?: Nullable<Json>; created_at?: string };
        Update: Partial<SourceRow>;
        Relationships: [];
      };
      artifacts: {
        Row: ArtifactRow;
        Insert: { notebook_id: string; kind: ArtifactRow["kind"]; source_id?: Nullable<string>; status?: ArtifactRow["status"]; payload_json?: Nullable<Json>; r2_keys?: Nullable<Json>; tier_used?: Nullable<"free" | "pro">; cost_cents?: number; created_at?: string };
        Update: Partial<ArtifactRow>;
        Relationships: [];
      };
      chunks: {
        Row: ChunkRow;
        Insert: { source_id: string; notebook_id: string; content: string; embedding?: Nullable<number[]>; start_sec?: Nullable<number>; page_num?: Nullable<number>; created_at?: string };
        Update: Partial<ChunkRow>;
        Relationships: [];
      };
      usage_meter: {
        Row: UsageMeterRow;
        Insert: { user_id: string; event: UsageMeterRow["event"]; video_minutes?: Nullable<number>; cost_cents?: number; created_at?: string };
        Update: Partial<UsageMeterRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// Convenience type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

// Suppress unused helper warning
void makeTable;
