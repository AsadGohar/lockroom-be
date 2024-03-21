import { Controller, Post, Get, Body, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { AuditLogsSerivce } from './audit-logs.service';
import * as path from 'path';
import { UploadService } from 'src/uploads/uploads.service';

@Controller('audit')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsSerivce,
    private readonly uploadsService: UploadService) {}

  @Post('login')
  createLoginLog(
    @Body('user_id') user_id: string,
    @Body('organization_id') organization_id: string,
    @Body('type') type: string,
  ) {
    return this.auditLogsService.create(
      null,
      user_id,
      organization_id,
      type,
    );
  }

  @Post('document')
  createDocumentLog(
    @Body('file_id') file_id: string,
    @Body('user_id') user_id: string,
    @Body('organization_id') organization_id: string,
    @Body('type') type: string,
  ) {
    return this.auditLogsService.create(
      file_id,
      user_id,
      organization_id,
      type,
    );
  }

  @Post('stats')
  stats(@Body('organization_id') organization_id: string, @Body('date') date: any) {
    return this.auditLogsService.getStats(organization_id, date);
  }

  @Get('')
  async getFile(@Param('organization_id') organization_id: string,@Res() res: Response) {
    const file = await this.auditLogsService.exportDataToExcel(organization_id)
    // const filePath = path.join(__dirname, '/src/excel-files/user/', file.name);

    // Set appropriate headers
    // res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    // res.setHeader('Content-Type', 'application/octet-stream');

    // Send the file
    // res.sendFile(filePath);
  }
}
