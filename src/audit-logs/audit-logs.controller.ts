import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
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
    @Body('room_id') room_id: string,
    @Body('type') type: string,
    @Request() request,
  ) {
    return this.auditLogsService.create(
      null,
      request.decoded_data.user_id,
      room_id,
      type,
    );
  }

  @UseGuards(AuthGuard)
  @Post('document')
  createDocumentLog(
    @Body('file_id') file_id: string,
    @Body('room_id') room_id: string,
    @Body('type') type: string,
    @Request() request,
  ) {
    return this.auditLogsService.create(
      file_id,
      request.decoded_data.user_id,
      room_id,
      type,
    );
  }

  @UseGuards(AuthGuard)
  @Post('stats')
  stats(
    @Body('room_id') room_id: string,
    @Body('date') date: any,
  ) {
    return this.auditLogsService.getStats(room_id, date);
  }

  @Get('report/:room_id')
  async getFile(@Param('room_id') room_id: string) {
    return await this.auditLogsService.exportDataToExcel(room_id);
  }
}
