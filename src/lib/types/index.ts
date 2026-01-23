// User & Auth Types
export type UserRole = 'USER' | 'GYM_OWNER' | 'TRAINER' | 'DIETICIAN' | 'ADMIN';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';

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
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
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
  ownerId: string;
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
  openingHours?: OpeningHours;
  verificationStatus: VerificationStatus;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  userId: string;
  user?: User;
  bio?: string;
  specializations: string[];
  certifications: string[];
  experience?: number;
  brandName?: string;
  portfolio: string[];
  verificationStatus: VerificationStatus;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dietician Types
export interface DieticianProfile {
  id: string;
  userId: string;
  user?: User;
  bio?: string;
  specializations: string[];
  certifications: string[];
  companyName?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: VerificationStatus;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Plan Types
export type DurationType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  durationType: DurationType;
  features: string[];
  isActive: boolean;
  gymId?: string;
  trainerId?: string;
  dieticianId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: Plan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  paymentMethod?: string;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
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
  minRating?: number;
  maxPrice?: number;
  facilities?: string[];
  specializations?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
