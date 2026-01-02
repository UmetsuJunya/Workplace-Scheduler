import { UserRole } from '@prisma/client';

/**
 * User data with optional password for create/update operations
 */
export interface UserDataWithOptionalPassword {
  name?: string;
  email?: string | null;
  password?: string;
  role?: UserRole;
}
