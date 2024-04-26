import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { AuditLogsSerivce } from './audit-logs.service';
import { UploadService } from 'src/uploads/uploads.service';
import { AuthGuard } from 'src/guards/auth.guard';
@Controller('audit')
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsSerivce,
    private readonly uploadsService: UploadService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('login')
  createLoginLog(
    @Body('organization_id') organization_id: string,
    @Body('type') type: string,
    @Request() request,
  ) {
    return this.auditLogsService.create(
      null,
      request.decoded_data.user_id,
      organization_id,
      type,
    );
  }

  @UseGuards(AuthGuard)
  @Post('document')
  createDocumentLog(
    @Body('file_id') file_id: string,
    @Body('organization_id') organization_id: string,
    @Body('type') type: string,
    @Request() request,
  ) {
    return this.auditLogsService.create(
      file_id,
      request.decoded_data.user_id,
      organization_id,
      type,
    );
  }

  @UseGuards(AuthGuard)
  @Post('stats')
  stats(
    @Body('organization_id') organization_id: string,
    @Body('date') date: any,
  ) {
    return this.auditLogsService.getStats(organization_id, date);
  }

  @Get('')
  async getFile(
    @Param('organization_id') organization_id: string,
    @Res() res: Response,
  ) {
    const file = await this.auditLogsService.exportDataToExcel(organization_id);
    // const filePath = path.join(__dirname, '/src/excel-files/user/', file.name);

    // Set appropriate headers
    // res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    // res.setHeader('Content-Type', 'application/octet-stream');

    // Send the file
    // res.sendFile(filePath);
  }
}
