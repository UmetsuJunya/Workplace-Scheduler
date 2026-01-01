import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OwnScheduleOrAdminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authEnabled = this.configService.get<string>('AUTH_ENABLED') === 'true';

    // If auth is disabled, allow all requests
    if (!authEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins can edit any schedule
    if (user.role === 'ADMIN') {
      return true;
    }

    // For creating schedules, check if the userId in the body matches the logged-in user
    if (request.method === 'POST') {
      const body = request.body;

      // Handle bulk create
      if (Array.isArray(body)) {
        const allOwnSchedules = body.every((schedule) => schedule.userId === user.userId);
        if (!allOwnSchedules) {
          throw new ForbiddenException('You can only create schedules for yourself');
        }
        return true;
      }

      // Handle single create
      if (body.userId && body.userId !== user.userId) {
        throw new ForbiddenException('You can only create schedules for yourself');
      }
      return true;
    }

    // For updating/deleting, we need to check the schedule owner
    // This will be handled in the service layer
    return true;
  }
}
