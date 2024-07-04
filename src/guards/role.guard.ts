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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRoleEnum[]>(
      'roles',
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const authToken = authorization.replace(/bearer/gim, '').trim();
    const user: any = jwtDecode(authToken);
    const find_user = await this.userService.findOne({ id: user?.user_id });

    return requiredRoles?.includes(find_user?.role as UserRoleEnum)
      ? true
      : false;
  }
}
