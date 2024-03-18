import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogs } from './entities/audit-logs.entities';

@Injectable()
export class AuditLogsSerivce {
  constructor(
    @InjectRepository(AuditLogs)
    private readonly auditLogsRepository: Repository<AuditLogs>,
  ) {}

  async create(name: string, user_id: string, organization_id: string) {}

  async findAll() {
    return await this.auditLogsRepository.find();
  }

  async findOne(id: string) {
    try {
      return await this.auditLogsRepository.findOne({
        where: {
          id,
        },
        relations: ['users'],
      });
    } catch (error) {}
  }

  update(id: number) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
