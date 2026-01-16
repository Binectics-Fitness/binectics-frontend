# Binectics API

NestJS 11 backend API with JWT authentication, Prisma ORM, and PostgreSQL.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup

**Option A: Use Mock Authentication (No Database Required)**
The frontend is currently using `mock-auth.ts` which works without a database.

**Option B: Set Up PostgreSQL (For Production)**

Install PostgreSQL:
```bash
brew install postgresql@16  # macOS
```

Start PostgreSQL:
```bash
brew services start postgresql@16
```

Create database:
```bash
createdb binectics
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

### 4. Generate Prisma Client
```bash
npm run prisma:generate
```

### 5. Run Migrations (if using PostgreSQL)
```bash
npm run prisma:migrate
```

## Running the API

### Development Mode
```bash
npm run start:dev
```

API will be available at: `http://localhost:4000/api`

### Production Build
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/me` - Get current user (authenticated)

## Testing Authentication

### 1. Register a User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@binectics.com",
    "password": "Admin@123456",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "ADMIN",
    "country": "United States"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@binectics.com",
    "password": "Admin@123456"
  }'
```

### 3. Forgot Password
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@binectics.com"
  }'
```

Response will include a reset token in development mode. Use it to reset password.

### 4. Reset Password
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN_HERE",
    "password": "NewPassword@123"
  }'
```

### 5. Change Password (Authenticated)
```bash
curl -X POST http://localhost:4000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "Admin@123456",
    "newPassword": "NewPassword@123"
  }'
```

## Database Management

### Prisma Studio (GUI)
```bash
npm run prisma:studio
```

### Create Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database
```bash
npx prisma migrate reset
```

## Switching from Mock to Real API

Once the backend is running:

1. Update frontend `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

2. In `src/contexts/AuthContext.tsx`, change:
```typescript
// FROM:
import { mockAuthService as authService } from '@/lib/api/mock-auth';

// TO:
import { authService } from '@/lib/api/auth';
```

3. Restart Next.js dev server

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL + Prisma ORM 7
- **Authentication**: JWT with Passport
- **Validation**: class-validator + class-transformer
- **Password Hashing**: bcrypt

## Project Structure

```
api/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── dto/           # Data transfer objects
│   │   ├── guards/        # JWT auth guard
│   │   ├── strategies/    # Passport JWT strategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/             # Users module
│   ├── prisma/            # Prisma service
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma      # Database schema
├── .env                   # Environment variables
└── package.json
```

## Next Steps

1. ✅ Authentication endpoints (login, register, password reset)
2. ⏳ Email service integration (for password reset emails)
3. ⏳ Admin verification workflow
4. ⏳ Provider profiles (Gym Owner, Trainer, Dietician)
5. ⏳ Plans & Subscriptions
6. ⏳ QR Check-in system
7. ⏳ Client Journals
