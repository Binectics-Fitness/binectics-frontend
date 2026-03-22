// User & Auth Types
export enum UserRole {
  USER = "USER",
  GYM_OWNER = "GYM_OWNER",
  TRAINER = "TRAINER",
  DIETITIAN = "DIETITIAN",
  ADMIN = "ADMIN",
}
export enum AccountType {
  GYM_OWNER = "gym_owner",
  PERSONAL_TRAINER = "personal_trainer",
  DIETITIAN = "dietitian",
  FITNESS_MEMBER = "fitness_member",
}
export enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}
export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

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
  fitness_goals?: string[];
  preferred_activities?: string[];
  other_name?: string;
  date_of_birth?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: AccountType;
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

// Dietitian Types
export interface DietitianProfile {
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
  dietitian_id?: string;
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

// Marketplace Types
export type MarketplaceAccountType =
  | "gym_owner"
  | "personal_trainer"
  | "dietitian";

export type MarketplaceRequestType = "connection" | "inquiry";

export type MarketplaceRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export enum MarketplaceVerificationBadge {
  NONE = "none",
  VERIFIED = "verified",
  PREMIUM_VERIFIED = "premium_verified",
  FEATURED = "featured",
}

export enum MembershipPlanType {
  SUBSCRIPTION = "subscription",
  ONE_TIME = "one_time",
}

export interface MarketplaceMembershipPlan {
  _id: string;
  organization_id: string;
  listing_id?: string;
  created_by: string;
  name: string;
  description?: string;
  plan_type: MembershipPlanType;
  duration_days: number;
  price: number;
  currency: string;
  features: string[];
  is_active: boolean;
  is_public: boolean;
  active_members: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceListing {
  _id: string;
  organization_id?: string | { _id: string; name: string; logo?: string };
  professional_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        profile_picture?: string;
      };
  account_type: MarketplaceAccountType;
  headline: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  languages: string[];
  photos: string[];
  profile_image?: string;
  profile_image_public_id?: string;
  gallery_image_public_ids?: string[];
  city?: string;
  country_code?: string;
  address?: string;
  location?: { type: string; coordinates: [number, number] };
  currency: string;
  price_from?: number;
  price_label?: string;
  accepting_clients: boolean;
  max_clients?: number;
  is_published: boolean;
  published_at?: string;
  verification_badge: MarketplaceVerificationBadge;
  badge_awarded_at?: string;
  badge_awarded_by?: string;
  supporting_documents_count?: number;
  is_suspended: boolean;
  suspension_reason?: string;
  active_client_count: number;
  average_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceListingDocument {
  _id: string;
  listing_id: string;
  organization_id: string;
  uploaded_by: string;
  file_url: string;
  file_public_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceRequest {
  _id: string;
  client_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture?: string;
      };
  listing_id: string | MarketplaceListing;
  organization_id?: string;
  professional_id:
    | string
    | { _id: string; first_name: string; last_name: string };
  type: MarketplaceRequestType;
  status: MarketplaceRequestStatus;
  message?: string;
  response_note?: string;
  starting_weight_kg?: number;
  target_weight_kg?: number;
  height_cm?: number;
  goals: string[];
  created_at: string;
  updated_at: string;
}

export interface MarketplaceReview {
  _id: string;
  client_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        profile_picture?: string;
      };
  listing_id: string;
  rating: number;
  comment?: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceSearchParams {
  account_type?: MarketplaceAccountType;
  country_code?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  specialties?: string;
  q?: string;
  accepting_clients?: boolean;
  min_rating?: number;
  sort?: "rating" | "newest" | "nearest";
  page?: number;
  limit?: number;
}

export interface MarketplaceSearchResult {
  listings: MarketplaceListing[];
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

// ─── Membership Subscriptions ─────────────────────────────────────────────

export interface CheckIn {
  _id: string;
  organization_id: string;
  listing_id: string | { _id: string; headline: string };
  member_user_id:
    | string
    | { _id: string; first_name: string; last_name: string; email: string };
  subscription_id?: string;
  checked_in_at: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export enum CheckInHistoryPeriod {
  TODAY = "today",
  WEEK = "week",
  MONTH = "month",
}

export interface MyCheckInStatus {
  has_checked_in_today: boolean;
  today_check_in_at?: string;
  last_check_in_at?: string;
  last_listing_id?: string;
}

export enum MembershipSubscriptionStatus {
  PENDING_PAYMENT = "pending_payment",
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export interface MembershipSubscription {
  _id: string;
  organization_id: string;
  plan_id:
    | string
    | {
        _id: string;
        name: string;
        description?: string;
        plan_type: MembershipPlanType;
        duration_days: number;
        price: number;
        currency: string;
        features: string[];
      };
  listing_id?:
    | string
    | { _id: string; headline: string; city?: string; country_code?: string };
  member_user_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
  status: MembershipSubscriptionStatus;
  start_date: string;
  end_date?: string;
  amount_paid: number;
  currency: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

