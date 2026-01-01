import { Injectable, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(private configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const authEnabled = this.configService.get<string>('AUTH_ENABLED') === 'true';

    if (!authEnabled) {
      // If AUTH_ENABLED is false, allow all requests
      return true;
    }

    // If AUTH_ENABLED is true, use JWT authentication
    return super.canActivate(context);
  }
}
