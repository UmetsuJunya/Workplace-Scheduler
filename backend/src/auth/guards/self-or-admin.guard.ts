import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const authEnabled = this.configService.get<string>('AUTH_ENABLED') === 'true';

    // If auth is disabled, allow all requests
    if (!authEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Allow if user is admin or updating their own profile
    if (user.role === 'ADMIN' || user.userId === targetUserId) {
      return true;
    }

    throw new ForbiddenException('You can only update your own profile');
  }
}
