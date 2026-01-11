// User Roles
export const USER_ROLES = {
  USER: 'USER',
  GYM_OWNER: 'GYM_OWNER',
  TRAINER: 'TRAINER',
  DIETICIAN: 'DIETICIAN',
  ADMIN: 'ADMIN',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  USER: 'Fitness Enthusiast',
  GYM_OWNER: 'Gym Owner',
  TRAINER: 'Personal Trainer',
  DIETICIAN: 'Dietician',
  ADMIN: 'Administrator',
};

// Verification
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

// Subscription
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

// Plan Durations
export const DURATION_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export const DURATION_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

// Supported Currencies
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
] as const;

// Common Gym Facilities
export const GYM_FACILITIES = [
  'Weight Training',
  'Cardio Equipment',
  'Swimming Pool',
  'Sauna',
  'Steam Room',
  'Group Classes',
  'Personal Training',
  'Locker Rooms',
  'Showers',
  'Parking',
  'WiFi',
  'Juice Bar',
  'Towel Service',
  'CrossFit',
  'Yoga Studio',
  'Boxing Ring',
  'Basketball Court',
  'Spinning Studio',
] as const;

// Trainer Specializations
export const TRAINER_SPECIALIZATIONS = [
  'Weight Loss',
  'Muscle Building',
  'Strength Training',
  'HIIT',
  'CrossFit',
  'Yoga',
  'Pilates',
  'Boxing',
  'MMA',
  'Rehabilitation',
  'Sports Performance',
  'Senior Fitness',
  'Pre/Post Natal',
  'Bodybuilding',
  'Functional Training',
] as const;

// Dietician Specializations
export const DIETICIAN_SPECIALIZATIONS = [
  'Weight Management',
  'Sports Nutrition',
  'Clinical Nutrition',
  'Diabetes Management',
  'Heart Health',
  'Vegan/Vegetarian',
  'Keto/Low Carb',
  'Food Allergies',
  'Eating Disorders',
  'Pediatric Nutrition',
  'Geriatric Nutrition',
  'Gut Health',
  'Hormone Balance',
] as const;
