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
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: []
      }
      labels: {
        Row: {
          color: string
          id: string
          name: string
        }
        Insert: {
          color: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database['public']['Enums']['app_role']
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database['public']['Enums']['app_role']
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database['public']['Enums']['app_role']
        }
        Relationships: []
      }
      task_labels: {
        Row: {
          label_id: string
          task_id: string
        }
        Insert: {
          label_id: string
          task_id: string
        }
        Update: {
          label_id?: string
          task_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database['public']['Enums']['task_priority']
          status: Database['public']['Enums']['task_status']
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database['public']['Enums']['task_priority']
          status?: Database['public']['Enums']['task_status']
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database['public']['Enums']['task_priority']
          status?: Database['public']['Enums']['task_status']
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_role: 'user' | 'admin'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
      task_status: 'todo' | 'in_progress' | 'in_review' | 'done'
    }
    CompositeTypes: Record<string, never>
  }
}
