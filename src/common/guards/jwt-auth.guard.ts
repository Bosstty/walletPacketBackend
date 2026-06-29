import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

type JwtPayload = {
  sub: string;
  openid: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtService = new JwtService({
    secret: process.env.JWT_SECRET ?? 'replace-me-in-production',
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user: AuthenticatedUser = {
        userId: payload.sub,
        openid: payload.openid,
      };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
