
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "assignments": {
                  Row: {
                    "assigned_by": string,"assigned_date": string,"assignment_type": Database["public"]['Enums']["assignment_type"],"created_at": string,"due_date": string | null,"end_ayah": number,"end_surah": number,"id": string,"idempotency_key": string,"instructions": string | null,"organization_id": string,"priority": number | null,"source_record_id": string | null,"start_ayah": number,"start_surah": number,"status": Database["public"]['Enums']["assignment_status"],"student_id": string,"student_reported_completed_at": string | null,"teacher_verified_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_by": string,"assigned_date"?: string,"assignment_type": Database["public"]['Enums']["assignment_type"],"created_at"?: string,"due_date"?: string | null,"end_ayah": number,"end_surah": number,"id"?: string,"idempotency_key": string,"instructions"?: string | null,"organization_id": string,"priority"?: number | null,"source_record_id"?: string | null,"start_ayah": number,"start_surah": number,"status"?: Database["public"]['Enums']["assignment_status"],"student_id": string,"student_reported_completed_at"?: string | null,"teacher_verified_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "assigned_by"?: string,"assigned_date"?: string,"assignment_type"?: Database["public"]['Enums']["assignment_type"],"created_at"?: string,"due_date"?: string | null,"end_ayah"?: number,"end_surah"?: number,"id"?: string,"idempotency_key"?: string,"instructions"?: string | null,"organization_id"?: string,"priority"?: number | null,"source_record_id"?: string | null,"start_ayah"?: number,"start_surah"?: number,"status"?: Database["public"]['Enums']["assignment_status"],"student_id"?: string,"student_reported_completed_at"?: string | null,"teacher_verified_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_end_surah_end_ayah_fkey"
      columns: ["end_surah","end_ayah"]
isOneToOne: false
      referencedRelation: "quran_ayahs"
      referencedColumns: ["surah_number","ayah_number"]
    },{
      foreignKeyName: "assignments_organization_id_source_record_id_fkey"
      columns: ["organization_id","source_record_id"]
isOneToOne: false
      referencedRelation: "memorization_records"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "assignments_organization_id_student_id_fkey"
      columns: ["organization_id","student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "assignments_start_surah_start_ayah_fkey"
      columns: ["start_surah","start_ayah"]
isOneToOne: false
      referencedRelation: "quran_ayahs"
      referencedColumns: ["surah_number","ayah_number"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_user_id": string | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": number,"metadata": NonNullable<Json>,"organization_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_user_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: never,"metadata"?: NonNullable<Json>,"organization_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_user_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: never,"metadata"?: NonNullable<Json>,"organization_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"class_enrollments": {
                  Row: {
                    "class_id": string,"created_at": string,"end_date": string | null,"id": string,"organization_id": string,"start_date": string,"status": Database["public"]['Enums']["link_status"],"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"created_at"?: string,"end_date"?: string | null,"id"?: string,"organization_id": string,"start_date"?: string,"status"?: Database["public"]['Enums']["link_status"],"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "class_id"?: string,"created_at"?: string,"end_date"?: string | null,"id"?: string,"organization_id"?: string,"start_date"?: string,"status"?: Database["public"]['Enums']["link_status"],"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_enrollments_organization_id_class_id_fkey"
      columns: ["organization_id","class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "class_enrollments_organization_id_student_id_fkey"
      columns: ["organization_id","student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["organization_id","id"]
    }
                  ]
                },"class_teachers": {
                  Row: {
                    "class_id": string,"created_at": string,"id": string,"organization_id": string,"teacher_user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"created_at"?: string,"id"?: string,"organization_id": string,"teacher_user_id": string
                  }
                  Update: {
                    "class_id"?: string,"created_at"?: string,"id"?: string,"organization_id"?: string,"teacher_user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_teachers_organization_id_class_id_fkey"
      columns: ["organization_id","class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "class_teachers_teacher_user_id_fkey"
      columns: ["teacher_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"classes": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"name": string,"organization_id": string,"status": Database["public"]['Enums']["record_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"organization_id": string,"status"?: Database["public"]['Enums']["record_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"organization_id"?: string,"status"?: Database["public"]['Enums']["record_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "classes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"created_at": string,"created_by": string,"email": string | null,"expires_at": string,"id": string,"intended_role": Database["public"]['Enums']["membership_role"] | null,"invitation_type": Database["public"]['Enums']["invitation_type"],"organization_id": string,"revoked_at": string | null,"student_id": string | null,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by": string,"email"?: string | null,"expires_at": string,"id"?: string,"intended_role"?: Database["public"]['Enums']["membership_role"] | null,"invitation_type": Database["public"]['Enums']["invitation_type"],"organization_id": string,"revoked_at"?: string | null,"student_id"?: string | null,"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string,"email"?: string | null,"expires_at"?: string,"id"?: string,"intended_role"?: Database["public"]['Enums']["membership_role"] | null,"invitation_type"?: Database["public"]['Enums']["invitation_type"],"organization_id"?: string,"revoked_at"?: string | null,"student_id"?: string | null,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_accepted_by_fkey"
      columns: ["accepted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitations_organization_id_student_id_fkey"
      columns: ["organization_id","student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["organization_id","id"]
    }
                  ]
                },"memorization_record_history": {
                  Row: {
                    "change_type": string,"changed_by": string | null,"created_at": string,"id": string,"memorization_record_id": string,"new_values": NonNullable<Json>,"organization_id": string,"previous_values": NonNullable<Json>,"reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "change_type": string,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"memorization_record_id": string,"new_values": NonNullable<Json>,"organization_id": string,"previous_values": NonNullable<Json>,"reason"?: string | null
                  }
                  Update: {
                    "change_type"?: string,"changed_by"?: string | null,"created_at"?: string,"id"?: string,"memorization_record_id"?: string,"new_values"?: NonNullable<Json>,"organization_id"?: string,"previous_values"?: NonNullable<Json>,"reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "memorization_record_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memorization_record_history_organization_id_memorization_r_fkey"
      columns: ["organization_id","memorization_record_id"]
isOneToOne: false
      referencedRelation: "memorization_records"
      referencedColumns: ["organization_id","id"]
    }
                  ]
                },"memorization_record_private_notes": {
                  Row: {
                    "body": string,"created_at": string,"organization_id": string,"record_id": string,"updated_at": string,"updated_by": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"organization_id": string,"record_id": string,"updated_at"?: string,"updated_by": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"organization_id"?: string,"record_id"?: string,"updated_at"?: string,"updated_by"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memorization_record_private_note_organization_id_record_id_fkey"
      columns: ["organization_id","record_id"]
isOneToOne: false
      referencedRelation: "memorization_records"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "memorization_record_private_notes_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"memorization_records": {
                  Row: {
                    "accuracy_score": number | null,"change_reason": string | null,"created_at": string,"created_by": string,"end_ayah": number,"end_surah": number,"id": string,"idempotency_key": string,"lesson_date": string,"mistake_categories": (string)[] | null,"organization_id": string,"parent_visible_feedback": string | null,"performance_rating": Database["public"]['Enums']["performance_rating"],"start_ayah": number,"start_surah": number,"status": Database["public"]['Enums']["lesson_status"],"student_id": string,"tajweed_assessment": string | null,"teacher_user_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accuracy_score"?: number | null,"change_reason"?: string | null,"created_at"?: string,"created_by": string,"end_ayah": number,"end_surah": number,"id"?: string,"idempotency_key": string,"lesson_date": string,"mistake_categories"?: (string)[] | null,"organization_id": string,"parent_visible_feedback"?: string | null,"performance_rating": Database["public"]['Enums']["performance_rating"],"start_ayah": number,"start_surah": number,"status"?: Database["public"]['Enums']["lesson_status"],"student_id": string,"tajweed_assessment"?: string | null,"teacher_user_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "accuracy_score"?: number | null,"change_reason"?: string | null,"created_at"?: string,"created_by"?: string,"end_ayah"?: number,"end_surah"?: number,"id"?: string,"idempotency_key"?: string,"lesson_date"?: string,"mistake_categories"?: (string)[] | null,"organization_id"?: string,"parent_visible_feedback"?: string | null,"performance_rating"?: Database["public"]['Enums']["performance_rating"],"start_ayah"?: number,"start_surah"?: number,"status"?: Database["public"]['Enums']["lesson_status"],"student_id"?: string,"tajweed_assessment"?: string | null,"teacher_user_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "memorization_records_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memorization_records_end_surah_end_ayah_fkey"
      columns: ["end_surah","end_ayah"]
isOneToOne: false
      referencedRelation: "quran_ayahs"
      referencedColumns: ["surah_number","ayah_number"]
    },{
      foreignKeyName: "memorization_records_organization_id_student_id_fkey"
      columns: ["organization_id","student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "memorization_records_start_surah_start_ayah_fkey"
      columns: ["start_surah","start_ayah"]
isOneToOne: false
      referencedRelation: "quran_ayahs"
      referencedColumns: ["surah_number","ayah_number"]
    },{
      foreignKeyName: "memorization_records_teacher_user_id_fkey"
      columns: ["teacher_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memorization_records_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organization_memberships": {
                  Row: {
                    "created_at": string,"id": string,"joined_at": string,"organization_id": string,"role": Database["public"]['Enums']["membership_role"],"status": Database["public"]['Enums']["membership_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"joined_at"?: string,"organization_id": string,"role": Database["public"]['Enums']["membership_role"],"status"?: Database["public"]['Enums']["membership_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"joined_at"?: string,"organization_id"?: string,"role"?: Database["public"]['Enums']["membership_role"],"status"?: Database["public"]['Enums']["membership_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organization_memberships_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organization_memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "contact_email": string | null,"contact_phone": string | null,"created_at": string,"description": string | null,"id": string,"logo_url": string | null,"name": string,"organization_type": string,"preferred_language": string,"riwayah": string,"slug": string | null,"status": Database["public"]['Enums']["organization_status"],"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"logo_url"?: string | null,"name": string,"organization_type"?: string,"preferred_language"?: string,"riwayah"?: string,"slug"?: string | null,"status"?: Database["public"]['Enums']["organization_status"],"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "contact_email"?: string | null,"contact_phone"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"logo_url"?: string | null,"name"?: string,"organization_type"?: string,"preferred_language"?: string,"riwayah"?: string,"slug"?: string | null,"status"?: Database["public"]['Enums']["organization_status"],"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"parent_student_relationships": {
                  Row: {
                    "created_at": string,"id": string,"organization_id": string,"parent_user_id": string,"relationship_type": string | null,"status": Database["public"]['Enums']["relationship_status"],"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"organization_id": string,"parent_user_id": string,"relationship_type"?: string | null,"status"?: Database["public"]['Enums']["relationship_status"],"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"organization_id"?: string,"parent_user_id"?: string,"relationship_type"?: string | null,"status"?: Database["public"]['Enums']["relationship_status"],"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "parent_student_relationships_organization_id_student_id_fkey"
      columns: ["organization_id","student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "parent_student_relationships_parent_user_id_fkey"
      columns: ["parent_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_contacts": {
                  Row: {
                    "created_at": string,"phone": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"phone": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"phone"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_contacts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"preferred_language": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string,"id": string,"preferred_language"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"preferred_language"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quran_ayahs": {
                  Row: {
                    "ayah_number": number,"hizb_quarter": number,"juz_number": number,"page_number": number,"surah_number": number
                  }
                  ComputedFields: never
                  Insert: {
                    "ayah_number": number,"hizb_quarter": number,"juz_number": number,"page_number": number,"surah_number": number
                  }
                  Update: {
                    "ayah_number"?: number,"hizb_quarter"?: number,"juz_number"?: number,"page_number"?: number,"surah_number"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quran_ayahs_surah_number_fkey"
      columns: ["surah_number"]
isOneToOne: false
      referencedRelation: "quran_surahs"
      referencedColumns: ["surah_number"]
    }
                  ]
                },"quran_surahs": {
                  Row: {
                    "ayah_count": number,"name_arabic": string,"name_english": string,"revelation_type": string,"surah_number": number,"transliteration": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ayah_count": number,"name_arabic": string,"name_english": string,"revelation_type": string,"surah_number": number,"transliteration": string
                  }
                  Update: {
                    "ayah_count"?: number,"name_arabic"?: string,"name_english"?: string,"revelation_type"?: string,"surah_number"?: number,"transliteration"?: string
                  }
                  Relationships: [
                    
                  ]
                },"student_private_notes": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"organization_id": string,"student_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"organization_id": string,"student_id": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"organization_id"?: string,"student_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "student_private_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "student_private_notes_organization_id_student_id_fkey"
      columns: ["organization_id","student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["organization_id","id"]
    }
                  ]
                },"students": {
                  Row: {
                    "created_at": string,"display_name": string,"enrollment_date": string,"id": string,"organization_id": string,"status": Database["public"]['Enums']["record_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"enrollment_date"?: string,"id"?: string,"organization_id": string,"status"?: Database["public"]['Enums']["record_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"enrollment_date"?: string,"id"?: string,"organization_id"?: string,"status"?: Database["public"]['Enums']["record_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "students_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"teacher_student_assignments": {
                  Row: {
                    "created_at": string,"end_date": string | null,"id": string,"organization_id": string,"start_date": string,"status": Database["public"]['Enums']["link_status"],"student_id": string,"teacher_user_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_date"?: string | null,"id"?: string,"organization_id": string,"start_date"?: string,"status"?: Database["public"]['Enums']["link_status"],"student_id": string,"teacher_user_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"end_date"?: string | null,"id"?: string,"organization_id"?: string,"start_date"?: string,"status"?: Database["public"]['Enums']["link_status"],"student_id"?: string,"teacher_user_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "teacher_student_assignments_organization_id_student_id_fkey"
      columns: ["organization_id","student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["organization_id","id"]
    },{
      foreignKeyName: "teacher_student_assignments_teacher_user_id_fkey"
      columns: ["teacher_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invitation":
{ Args: { "p_token": string }; Returns: Json
                           },
"archive_student":
{ Args: { "p_student_id": string }; Returns: undefined
                           },
"create_class":
{ Args: { "p_name": string,"p_organization_id": string }; Returns: string
                           },
"create_invitation":
{ Args: { "p_email"?: string,"p_organization_id": string,"p_student_id"?: string,"p_type": Database["public"]['Enums']["invitation_type"],"p_valid_for"?: string }; Returns: string
                           },
"create_organization":
{ Args: { "p_also_teacher"?: boolean,"p_name": string,"p_organization_type"?: string,"p_preferred_language"?: string,"p_timezone"?: string }; Returns: string
                           },
"enroll_existing_student":
{ Args: { "p_class_id": string,"p_student_id": string }; Returns: undefined
                           },
"enroll_new_student":
{ Args: { "p_allow_duplicate"?: boolean,"p_class_id": string,"p_display_name": string }; Returns: string
                           },
"record_lesson":
{ Args: { "p_accuracy_score"?: number,"p_completes_assignment_id"?: string,"p_end_ayah": number,"p_end_surah": number,"p_idempotency_key": string,"p_lesson_date": string,"p_mistake_categories"?: (string)[],"p_next_memorization"?: Json,"p_next_revisions"?: Json,"p_parent_visible_feedback"?: string,"p_performance_rating": Database["public"]['Enums']["performance_rating"],"p_private_note"?: string,"p_start_ayah": number,"p_start_surah": number,"p_student_id": string }; Returns: string
                           },
"revoke_invitation":
{ Args: { "p_invitation_id": string }; Returns: undefined
                           },
"student_juz_progress":
{ Args: { "p_student_ids": (string)[] }; Returns: {
              "juz": number,"percent": number,"student_id": string
            }[]
                           },
"student_progress":
{ Args: { "p_student_ids": (string)[] }; Returns: {
              "last_lesson_date": string,"last_rating": Database["public"]['Enums']["performance_rating"],"mem_end_ayah": number,"mem_end_surah": number,"mem_start_ayah": number,"mem_start_surah": number,"student_id": string
            }[]
                           },
"unassigned_students":
{ Args: { "p_class_id": string }; Returns: {
              "display_name": string,"id": string
            }[]
                           },
"unenroll_student":
{ Args: { "p_class_id": string,"p_student_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "assignment_status": "assigned"|"in_progress"|"student_reported"|"teacher_verified"|"needs_practice"|"cancelled","assignment_type": "memorization"|"revision","invitation_type": "teacher"|"parent","lesson_status": "active"|"deleted","link_status": "active"|"ended","membership_role": "admin"|"teacher","membership_status": "active"|"revoked","organization_status": "active"|"suspended"|"archived","performance_rating": "excellent"|"very_good"|"good"|"needs_improvement"|"not_completed","record_status": "active"|"archived","relationship_status": "pending"|"verified"|"revoked"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "assignment_status": ["assigned", "in_progress", "student_reported", "teacher_verified", "needs_practice", "cancelled"],"assignment_type": ["memorization", "revision"],"invitation_type": ["teacher", "parent"],"lesson_status": ["active", "deleted"],"link_status": ["active", "ended"],"membership_role": ["admin", "teacher"],"membership_status": ["active", "revoked"],"organization_status": ["active", "suspended", "archived"],"performance_rating": ["excellent", "very_good", "good", "needs_improvement", "not_completed"],"record_status": ["active", "archived"],"relationship_status": ["pending", "verified", "revoked"]
          }
        }
} as const
