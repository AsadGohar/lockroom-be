import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Folder } from 'src/folders/entities/folder.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Invite } from 'src/invites/entities/invite.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { File } from 'src/files/entities/file.entity';
import { AuditLogs } from 'src/audit-logs/entities/audit-logs.entities';
import { AuditLogsSerivce } from 'src/audit-logs/audit-logs.service';
import { OTPService } from 'src/otp/otp.service';
import { SubscriptionsService } from 'src/subscription-plans/subscription-plans.service';
import { SubscriptionPlans } from 'src/subscription-plans/entities/subscription-plan.entity';
import { EmailService } from 'src/email/email.service';
@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([
      User,
      Folder,
      Group,
      Invite,
      Organization,
      File,
      AuditLogs,
      SubscriptionPlans
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuditLogsSerivce, OTPService, SubscriptionsService, EmailService],
  exports: [UsersService],
})
export class UsersModule {}
