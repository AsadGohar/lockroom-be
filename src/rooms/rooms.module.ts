import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Folder } from 'src/folders/entities/folder.entity';
import { Group } from 'src/groups/entities/group.entity';
import { SubscriptionPlans } from 'src/subscription-plans/entities/subscription-plan.entity'
import { Organization } from 'src/organizations/entities/organization.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { OTPService } from 'src/otp/otp.service';
import { SubscriptionsService } from 'src/subscription-plans/subscription-plans.service';
import { EmailService } from 'src/email/email.service';
import { File } from 'src/files/entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      User,
      Folder,
      Group,
      Organization,
      Invite,
      AuditLogs,
      File,
      SubscriptionPlans
    ]),
  ],
  controllers: [RoomsController],
  providers: [
    RoomsService,
    JwtService,
    UsersService,
    AuditLogsSerivce,
    OTPService,
    SubscriptionsService,
    EmailService
  ],
})
export class RoomsModule {}
