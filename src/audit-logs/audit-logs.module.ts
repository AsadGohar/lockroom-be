import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { AuditLogs } from './entities/audit-logs.entities';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsSerivce } from './audit-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLogs])],
  controllers: [AuditLogsController],
  providers: [AuditLogsSerivce],
  exports: [AuditLogsSerivce],
})
export class AuditLogsModule {}
