export interface Profile {
  exam_type: string
  exam_year: number | null
  prep_level: string | null
  city: string | null
  mobile: string | null
  gender: string | null
  streak_count: number
}

export interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
  profile: Profile | null
  optional_subjects: string[]
}

export interface Mcq {
  id: number
  set_id: number
  question: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct: string
}

export interface McqSet {
  id: number
  subject: string
  mcq_count: number
}

export interface SubjectCount {
  subject: string
  count: number
}

export interface QuizResult {
  mcq_id: number
  question: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  selected: string
  correct: string
  is_correct: boolean
}

export interface QuizSubmitResponse {
  total: number
  correct: number
  score_pct: number
  results: QuizResult[]
}

export interface EssayTopic {
  id: number
  category: string
  title: string
  is_active: boolean
}

export interface Essay {
  id: number
  user_id: number
  topic_id: number
  pdf_name: string
  pdf_size: number | null
  status: 'pending' | 'reviewed' | 'rejected'
  score: number | null
  feedback: string | null
  submitted_at: string
  reviewed_at: string | null
  topic: EssayTopic | null
}

export interface Book {
  id: number
  user_id: number
  title: string
  category: string
  condition: string
  price: number
  description: string | null
  contact_details: string
  image_paths: string[]
  is_available: boolean
  created_at: string
  seller_name: string | null
}

export interface NewsArticle {
  title: string
  summary: string
  link: string
  published: string
  source: string
  subject: string
}

export interface PartnerUser {
  id: number
  name: string
  city: string | null
  prep_level: string | null
  exam_type: string | null
  optional_subjects: string[]
}

export interface Connection {
  id: number
  status: string
  partner: PartnerUser
  created_at: string
}

export interface Message {
  id: number
  connection_id: number
  sender_id: number
  content: string
  is_read: boolean
  sent_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages?: number
}
