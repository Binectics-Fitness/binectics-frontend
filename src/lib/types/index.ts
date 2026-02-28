// User & Auth Types
export type UserRole = "USER" | "GYM_OWNER" | "TRAINER" | "DIETICIAN" | "ADMIN";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type SubscriptionStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "CANCELLED"
  | "EXPIRED";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  profile_picture?: string;
  role: UserRole;
  is_email_verified: boolean;
  is_onboarding_complete?: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  country_code?: string;
  is_suspended?: boolean;
  company_name?: string;
  company_logo?: string;
  is_company?: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  accept_tos: boolean;
  phone?: string;
  phone_number?: string;
  country_code?: string;
}

// Gym Types
export interface Gym {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  facilities: string[];
  images: string[];
  opening_hours?: OpeningHours;
  verification_status: VerificationStatus;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

// Trainer Types
export interface TrainerProfile {
  id: string;
  user_id: string;
  user?: User;
  bio?: string;
  specializations: string[];
  certifications: string[];
  experience?: number;
  brand_name?: string;
  portfolio: string[];
  verification_status: VerificationStatus;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

// Dietician Types
export interface DieticianProfile {
  id: string;
  user_id: string;
  user?: User;
  bio?: string;
  specializations: string[];
  certifications: string[];
  company_name?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  verification_status: VerificationStatus;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

// Plan Types
export type DurationType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  duration_type: DurationType;
  features: string[];
  is_active: boolean;
  gym_id?: string;
  trainer_id?: string;
  dietician_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Subscription Types
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan?: Plan;
  status: SubscriptionStatus;
  start_date: Date;
  end_date: Date;
  payment_id?: string;
  payment_method?: string;
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

// Search & Filter Types
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface SearchFilters {
  query?: string;
  city?: string;
  country?: string;
  location?: GeoLocation;
  radius?: number; // km
  min_rating?: number;
  max_price?: number;
  facilities?: string[];
  specializations?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
