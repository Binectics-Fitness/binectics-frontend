# AI Development Rules for Binectics Frontend

## Database Model Naming Convention

**ABSOLUTE RULE: ALL API RESPONSE PROPERTIES MUST USE SNAKE_CASE**

### ✅ Correct (snake_case):
```typescript
interface User {
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  profile_picture?: string;
}

interface Gym {
  owner_id: string;
  verification_status: VerificationStatus;
  is_public: boolean;
  opening_hours?: OpeningHours;
}

interface Subscription {
  user_id: string;
  plan_id: string;
  start_date: Date;
  end_date: Date;
  payment_id?: string;
}
```

### ❌ Wrong (camelCase):
```typescript
interface User {
  firstName: string;        // ❌ Wrong
  lastName: string;         // ❌ Wrong
  isEmailVerified: boolean; // ❌ Wrong
  createdAt: Date;          // ❌ Wrong
  profilePicture?: string;  // ❌ Wrong
}

interface Gym {
  ownerId: string;              // ❌ Wrong
  verificationStatus: string;   // ❌ Wrong
  isPublic: boolean;            // ❌ Wrong
  openingHours?: OpeningHours;  // ❌ Wrong
}
```

## Why Snake Case?

1. **Backend Consistency**: The NestJS backend API uses snake_case in all database models and API responses
2. **MongoDB Convention**: MongoDB field names use snake_case
3. **API Contract**: Frontend must match backend API response structure exactly
4. **Type Safety**: TypeScript interfaces must reflect actual API response shape

## Migration Completed

Date: February 23, 2026
Branch: `chore/migrate-database-models-to-snake-case`

### Changed Interfaces

All TypeScript interfaces in `src/lib/types/index.ts` updated:

1. **User** - Already using snake_case ✅
2. **Gym** 
   - `ownerId` → `owner_id`
   - `verificationStatus` → `verification_status`
   - `isPublic` → `is_public`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`
   - `openingHours` → `opening_hours`

3. **TrainerProfile**
   - `userId` → `user_id`
   - `brandName` → `brand_name`
   - `verificationStatus` → `verification_status`
   - `isPublic` → `is_public`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

4. **DieticianProfile**
   - `userId` → `user_id`
   - `companyName` → `company_name`
   - `verificationStatus` → `verification_status`
   - `isPublic` → `is_public`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

5. **Plan**
   - `durationType` → `duration_type`
   - `isActive` → `is_active`
   - `gymId` → `gym_id`
   - `trainerId` → `trainer_id`
   - `dieticianId` → `dietician_id`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

6. **Subscription**
   - `userId` → `user_id`
   - `planId` → `plan_id`
   - `startDate` → `start_date`
   - `endDate` → `end_date`
   - `paymentId` → `payment_id`
   - `paymentMethod` → `payment_method`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`

7. **SearchFilters**
   - `minRating` → `min_rating`
   - `maxPrice` → `max_price`

8. **PaginatedResponse**
   - `totalPages` → `total_pages`

## Future Development

When creating new types or interfaces that represent API data:

1. Always use snake_case for property names
2. Match the backend API response structure exactly
3. Reference existing types in `src/lib/types/index.ts` as examples
4. Never use camelCase for database/API-related properties

## Related Backend Rules

See `/Users/daniel/Documents/GitHub/binectics-api/AI_RULES.md` for backend conventions.

## Testing

All pages build successfully with these type changes (verified Feb 23, 2026).
Component updates may be needed as API integration progresses.
