import { UserRole } from '@prisma/client';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  sub: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authenticated user interface (attached to request after JWT validation)
 */
export interface AuthenticatedUser {
  userId: string;
  name: string;
  role: UserRole;
}

/**
 * User without password (for safe user data transmission)
 */
export interface UserWithoutPassword {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    role: UserRole;
  };
}
