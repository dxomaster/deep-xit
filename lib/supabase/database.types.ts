export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          status: 'LOBBY' | 'STORYTELLING' | 'BLUFFING' | 'VOTING' | 'SCORING' | 'FINISHED'
          storyteller_id: string | null
          clue: string | null
          theme: string | null
          max_rounds: number
          current_round: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          status?: 'LOBBY' | 'STORYTELLING' | 'BLUFFING' | 'VOTING' | 'SCORING' | 'FINISHED'
          storyteller_id?: string | null
          clue?: string | null
          theme?: string | null
          max_rounds?: number
          current_round?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status?: 'LOBBY' | 'STORYTELLING' | 'BLUFFING' | 'VOTING' | 'SCORING' | 'FINISHED'
          storyteller_id?: string | null
          clue?: string | null
          theme?: string | null
          max_rounds?: number
          current_round?: number
          created_at?: string
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: string
          room_id: string
          display_name: string
          score: number
          session_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          display_name: string
          score?: number
          session_id: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          display_name?: string
          score?: number
          session_id?: string
          created_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          room_id: string
          player_id: string
          image_url: string
          is_storyteller_card: boolean
          is_submitted_for_round: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          image_url: string
          is_storyteller_card?: boolean
          is_submitted_for_round?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          image_url?: string
          is_storyteller_card?: boolean
          is_submitted_for_round?: boolean
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          room_id: string
          voter_id: string
          card_id: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          voter_id: string
          card_id: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          voter_id?: string
          card_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      room_status: 'LOBBY' | 'STORYTELLING' | 'BLUFFING' | 'VOTING' | 'SCORING' | 'FINISHED'
    }
  }
}
