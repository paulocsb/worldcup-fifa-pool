export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      group_predictions: {
        Row: {
          created_at: string
          first_team_id: number
          fourth_team_id: number
          group_letter: string
          id: number
          second_team_id: number
          third_team_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_team_id: number
          fourth_team_id: number
          group_letter: string
          id?: never
          second_team_id: number
          third_team_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_team_id?: number
          fourth_team_id?: number
          group_letter?: string
          id?: never
          second_team_id?: number
          third_team_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_predictions_first_team_id_fkey"
            columns: ["first_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "group_predictions_first_team_id_fkey"
            columns: ["first_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_fourth_team_id_fkey"
            columns: ["fourth_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "group_predictions_fourth_team_id_fkey"
            columns: ["fourth_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_second_team_id_fkey"
            columns: ["second_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "group_predictions_second_team_id_fkey"
            columns: ["second_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_third_team_id_fkey"
            columns: ["third_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "group_predictions_third_team_id_fkey"
            columns: ["third_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_total_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_score_extra: number | null
          away_score_penalties: number | null
          away_team_id: number | null
          created_at: string
          detail_synced_at: string | null
          elapsed_minutes: number | null
          elapsed_extra_minutes: number | null
          events: Json | null
          group_letter: string | null
          home_score: number | null
          home_score_extra: number | null
          home_score_penalties: number | null
          home_team_id: number | null
          id: number
          kickoff_at: string
          last_synced_at: string | null
          lineups: Json | null
          live_status_short: string | null
          matchday: number | null
          stage: Database["public"]["Enums"]["match_stage"]
          statistics: Json | null
          status: Database["public"]["Enums"]["match_status"]
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_score_extra?: number | null
          away_score_penalties?: number | null
          away_team_id?: number | null
          created_at?: string
          detail_synced_at?: string | null
          elapsed_minutes?: number | null
          elapsed_extra_minutes?: number | null
          events?: Json | null
          group_letter?: string | null
          home_score?: number | null
          home_score_extra?: number | null
          home_score_penalties?: number | null
          home_team_id?: number | null
          id: number
          kickoff_at: string
          last_synced_at?: string | null
          lineups?: Json | null
          live_status_short?: string | null
          matchday?: number | null
          stage: Database["public"]["Enums"]["match_stage"]
          statistics?: Json | null
          status?: Database["public"]["Enums"]["match_status"]
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_score_extra?: number | null
          away_score_penalties?: number | null
          away_team_id?: number | null
          created_at?: string
          detail_synced_at?: string | null
          elapsed_minutes?: number | null
          elapsed_extra_minutes?: number | null
          events?: Json | null
          group_letter?: string | null
          home_score?: number | null
          home_score_extra?: number | null
          home_score_penalties?: number | null
          home_team_id?: number | null
          id?: number
          kickoff_at?: string
          last_synced_at?: string | null
          lineups?: Json | null
          live_status_short?: string | null
          matchday?: number | null
          stage?: Database["public"]["Enums"]["match_stage"]
          statistics?: Json | null
          status?: Database["public"]["Enums"]["match_status"]
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          away_score: number
          created_at: string
          home_score: number
          id: number
          match_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          away_score: number
          created_at?: string
          home_score: number
          id?: never
          match_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          away_score?: number
          created_at?: string
          home_score?: number
          id?: never
          match_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_total_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_seed: string
          avatar_style: string
          created_at: string
          display_name: string
          favorite_team_id: number | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_seed: string
          avatar_style?: string
          created_at?: string
          display_name: string
          favorite_team_id?: number | null
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_seed?: string
          avatar_style?: string
          created_at?: string
          display_name?: string
          favorite_team_id?: number | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "profiles_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          breakdown: Json
          computed_at: string
          group_letter: string | null
          id: number
          match_id: number | null
          points: number
          source: Database["public"]["Enums"]["score_source"]
          user_id: string
        }
        Insert: {
          breakdown?: Json
          computed_at?: string
          group_letter?: string | null
          id?: never
          match_id?: number | null
          points: number
          source: Database["public"]["Enums"]["score_source"]
          user_id: string
        }
        Update: {
          breakdown?: Json
          computed_at?: string
          group_letter?: string | null
          id?: never
          match_id?: number | null
          points?: number
          source?: Database["public"]["Enums"]["score_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_total_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scoring_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      teams: {
        Row: {
          api_team_id: number | null
          code: string
          created_at: string
          fifa_ranking: number | null
          flag_url: string | null
          group_letter: string
          id: number
          name: string
        }
        Insert: {
          api_team_id?: number | null
          code: string
          created_at?: string
          fifa_ranking?: number | null
          flag_url?: string | null
          group_letter: string
          id: number
          name: string
        }
        Update: {
          api_team_id?: number | null
          code?: string
          created_at?: string
          fifa_ranking?: number | null
          flag_url?: string | null
          group_letter?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      tournament_predictions: {
        Row: {
          champion_team_id: number
          created_at: string
          runner_up_team_id: number
          third_place_team_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          champion_team_id: number
          created_at?: string
          runner_up_team_id: number
          third_place_team_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          champion_team_id?: number
          created_at?: string
          runner_up_team_id?: number
          third_place_team_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_predictions_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournament_predictions_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_runner_up_team_id_fkey"
            columns: ["runner_up_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournament_predictions_runner_up_team_id_fkey"
            columns: ["runner_up_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_third_place_team_id_fkey"
            columns: ["third_place_team_id"]
            isOneToOne: false
            referencedRelation: "group_standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournament_predictions_third_place_team_id_fkey"
            columns: ["third_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_total_scores"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      group_standings: {
        Row: {
          drawn: number | null
          flag_url: string | null
          goal_diff: number | null
          goals_against: number | null
          goals_for: number | null
          group_letter: string | null
          lost: number | null
          played: number | null
          points: number | null
          position: number | null
          team_code: string | null
          team_id: number | null
          team_name: string | null
          won: number | null
        }
        Relationships: []
      }
      user_total_scores: {
        Row: {
          avatar_seed: string | null
          avatar_style: string | null
          display_name: string | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      group_predictions_open: {
        Args: { p_group_letter: string }
        Returns: boolean
      }
      invoke_edge_function: {
        Args: { body?: Json; fn_name: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      match_predictions_open: { Args: { p_match_id: number }; Returns: boolean }
      validate_invite: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      match_stage:
        | "group"
        | "round_of_32"
        | "round_of_16"
        | "quarter_final"
        | "semi_final"
        | "third_place"
        | "final"
      match_status:
        | "scheduled"
        | "live"
        | "finished"
        | "postponed"
        | "cancelled"
      score_source: "match" | "group" | "tournament"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      match_stage: [
        "group",
        "round_of_32",
        "round_of_16",
        "quarter_final",
        "semi_final",
        "third_place",
        "final",
      ],
      match_status: [
        "scheduled",
        "live",
        "finished",
        "postponed",
        "cancelled",
      ],
      score_source: ["match", "group", "tournament"],
    },
  },
} as const


// ----------------------------------------------------------------------------
// Aliases convenientes (mantidos para os imports do app)
// ----------------------------------------------------------------------------
type AppTables = Database['public']['Tables']
type AppViews = Database['public']['Views']

export type Team = AppTables['teams']['Row']
export type Match = AppTables['matches']['Row']
export type Profile = AppTables['profiles']['Row']
export type Prediction = AppTables['predictions']['Row']
export type GroupPrediction = AppTables['group_predictions']['Row']
export type TournamentPrediction = AppTables['tournament_predictions']['Row']
export type Score = AppTables['scores']['Row']
export type Invite = AppTables['invites']['Row']
export type UserTotalScore = AppViews['user_total_scores']['Row']
export type GroupStanding = AppViews['group_standings']['Row']

export type MatchStage = Database['public']['Enums']['match_stage']
export type MatchStatus = Database['public']['Enums']['match_status']
export type ScoreSource = Database['public']['Enums']['score_source']
