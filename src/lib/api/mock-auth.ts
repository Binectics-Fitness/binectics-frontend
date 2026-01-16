/**
 * Mock Authentication Service
 * This is a temporary solution that stores users in localStorage
 * until the backend API is ready.
 */

import type {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ApiResponse,
} from '@/lib/types';

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Mock user database in localStorage
const MOCK_USERS_KEY = 'binectics_mock_users';

// Helper to get all users
function getAllUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const usersStr = localStorage.getItem(MOCK_USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
}

// Helper to save users
function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

// Generate mock tokens
function generateTokens(): AuthTokens {
  return {
    accessToken: 'mock_access_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
    expiresIn: 604800, // 7 days in seconds
  };
}

// Store tokens
function storeTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

// Clear auth data
function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/**
 * Mock Authentication Service
 */
export const mockAuthService = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getAllUsers();
    const user = users.find(
      (u) => u.email === data.email && u.passwordHash === data.password
    );

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }

    const tokens = generateTokens();
    storeTokens(tokens.accessToken, tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return {
      success: true,
      data: {
        user,
        tokens,
      },
    };
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getAllUsers();

    // Check if user already exists
    if (users.some((u) => u.email === data.email)) {
      return {
        success: false,
        message: 'User with this email already exists',
      };
    }

    // Create new user
    const newUser: User = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      country: data.country || 'United States',
      passwordHash: data.password, // In mock, we store password directly
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOnboardingComplete: false,
      isSuspended: false,
      isEmailVerified: true, // Auto-verify in mock
    };

    // Add to users array
    users.push(newUser);
    saveUsers(users);

    // Generate tokens and store
    const tokens = generateTokens();
    storeTokens(tokens.accessToken, tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    return {
      success: true,
      data: {
        user: newUser,
        tokens,
      },
    };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    clearAuth();
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },

  /**
   * Update stored user data
   */
  updateUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));

    // Also update in users array
    const users = getAllUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      saveUsers(users);
    }
  },

  /**
   * Get all registered users (for debugging)
   */
  getAllUsers(): User[] {
    return getAllUsers();
  },

  /**
   * Clear all users (for debugging)
   */
  clearAllUsers(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(MOCK_USERS_KEY);
  },
};
