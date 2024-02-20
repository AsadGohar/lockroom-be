import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const { sWTNNOCEN }: any = request.cookie;
      if (!sWTNNOCEN || sWTNNOCEN.trim() === '') {
        throw new UnauthorizedException('Please provide token');
      }
      const authToken = sWTNNOCEN.replace(/bearer/gim, '').trim();
      const resp = await this.jwtService.verify(authToken)
      request.decodedData = resp;
      return true;
    } catch (error) {
      console.log('auth error - ', error.message);
      throw new ForbiddenException(
        error.message || 'session expired! Please sign In',
      );
    }
  }
}
