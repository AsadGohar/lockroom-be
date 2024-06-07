import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { jwtDecode } from 'jwt-decode';
import { UserRoleEnum } from 'src/types/enums';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly userService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRoleEnum[]>(
      'roles',
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const authToken = authorization.replace(/bearer/gim, '').trim();
    const user: any = jwtDecode(authToken);
    const userRole = user?.role;

    return requiredRoles?.includes(userRole) ? true : false;
  }
}
