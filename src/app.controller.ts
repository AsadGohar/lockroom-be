import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';
import { Roles } from './guards/role.decorator';
import { UserRoleEnum } from './types/enums';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Roles([UserRoleEnum.GUEST, UserRoleEnum.ADMIN])
  getHello(): string {
    return this.appService.getHello();
  }
}
