import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UserWithoutPassword, LoginResponse } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(emailOrName: string, password: string): Promise<UserWithoutPassword> {
    // Try to find user by email first, then by name
    let user = await this.usersService.findByEmail(emailOrName);
    if (!user) {
      user = await this.usersService.findByName(emailOrName);
    }

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: UserWithoutPassword): Promise<LoginResponse> {
    const payload = { name: user.name, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const authEnabled =
      this.configService.get<string>('AUTH_ENABLED') === 'true';
    const users = await this.usersService.findAll();

    // If AUTH is enabled, only allow registration when there are no users
    if (authEnabled && users.length > 0) {
      throw new ForbiddenException(
        'Registration is closed. Please contact an administrator.',
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // First user is always admin
    const role = users.length === 0 ? 'ADMIN' : 'USER';

    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const { password: _, ...result } = user;
    return this.login(result);
  }

  async canRegister(): Promise<boolean> {
    const authEnabled =
      this.configService.get<string>('AUTH_ENABLED') === 'true';

    if (!authEnabled) {
      return false; // When auth is disabled, no signup page needed
    }

    const users = await this.usersService.findAll();
    return users.length === 0; // Only allow signup when no users exist
  }
}
