// ABOUTME: Database types generated from Supabase schema
// ABOUTME: Will be auto-generated after first migration

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
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          header_url: string | null
          location: string | null
          website: string | null
          followers_count: number
          following_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          header_url?: string | null
          location?: string | null
          website?: string | null
          followers_count?: number
          following_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          header_url?: string | null
          location?: string | null
          website?: string | null
          followers_count?: number
          following_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          reply_to_id: string | null
          quote_of_id: string | null
          likes_count: number
          retweets_count: number
          replies_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          reply_to_id?: string | null
          quote_of_id?: string | null
          likes_count?: number
          retweets_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          reply_to_id?: string | null
          quote_of_id?: string | null
          likes_count?: number
          retweets_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
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
      [_ in never]: never
    }
  }
}
