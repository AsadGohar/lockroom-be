import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuditLogsSerivce } from './audit-logs.service';

@Controller('audit')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsSerivce) {}

  @Post()
  create(@Body('name') name:string, @Body('user_id') user_id: string, @Body('organization_id')  organization_id:string) {
    // return this.groupsService.create(name, user_id, organization_id);
  }
}