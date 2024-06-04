import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from 'src/types/enums';

export const Roles = (roles: UserRoleEnum[]) => SetMetadata('roles', roles);
