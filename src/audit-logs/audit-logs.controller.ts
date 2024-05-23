import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuditLogsSerivce } from './audit-logs.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PartialDto } from './dto/partial-audit.dto';
@Controller('audit')
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsSerivce,
  ) {}

  @UseGuards(AuthGuard)
  @Post('login')
  createLoginLog(@Body(ValidationPipe) dto: PartialDto) {
    return this.auditLogsService.create(dto);
  }

  @UseGuards(AuthGuard)
  @Post('document')
  createDocumentLog(@Body(ValidationPipe) dto: PartialDto) {
    return this.auditLogsService.create(dto);
  }

  @UseGuards(AuthGuard)
  @Post('stats')
  stats(@Body(ValidationPipe) dto: PartialDto) {
    return this.auditLogsService.getStats(dto);
  }

  @Get('')
  async getFile(@Param('organization_id') organization_id: string) {
    return await this.auditLogsService.exportDataToExcel(organization_id);
  }
}
