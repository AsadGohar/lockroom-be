import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogs } from './entities/audit-logs.entities';
import { File } from 'src/files/entities/file.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { User } from 'src/users/entities/user.entity';
import { subMonths, format, subDays } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { PartialDto } from './dto/partial-audit.dto';
@Injectable()
export class AuditLogsSerivce {
  constructor(
    @InjectRepository(AuditLogs)
    private readonly auditLogsRepository: Repository<AuditLogs>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: PartialDto) {
    try {
      const { user_id, organization_id, file_id, type } = dto;
      // if(type == 'login') file_id = null
      const find_user = await this.userRepository.findOne({
        relations: ['groups', 'created_groups'],
        where: { id: user_id },
      });
      const find_file = file_id
        ? await this.fileRepository.findOne({
            where: { is_deleted: false, id: file_id },
          })
        : null;
      const find_org = await this.orgRepository.findOne({
        where: { id: organization_id },
      });
      const groups = [...find_user.groups, ...find_user.created_groups];
      const audit_logs = groups.map((item) => {
        return this.auditLogsRepository.create({
          file: file_id ? find_file : null,
          organization: find_org,
          user: find_user,
          group: item,
          type,
        });
      });
      return await this.auditLogsRepository.save(audit_logs);
    } catch (error) {
      throw new Error(error);
    }
  }

  async getStats(dto: PartialDto) {
    try {
      let { organization_id, date } = dto;
      let start_date;
      if (date.type == 'days') start_date = subDays(new Date(), date.value);
      else if (date.type == 'months')
      start_date = subMonths(new Date(), date.value);
      const formattedStartDate = start_date && format(start_date, 'yyyy-MM-dd');
      const group_rankings_query = this.auditLogsRepository
        .createQueryBuilder('audit_logs')
        .select('group.name', 'group_name')
        .addSelect('COUNT(*)', 'total')
        .addSelect(`COUNT(*) FILTER (WHERE audit_logs.type = 'view')`, 'views')
        .addSelect(`COUNT(*) FILTER (WHERE audit_logs.type = 'login')`, 'login')
        .where('audit_logs.organizationId = :organization_id', {
          organization_id,
        })
        .leftJoin('audit_logs.group', 'group')
        .groupBy('group.name');
      const user_rankings_query = this.auditLogsRepository
        .createQueryBuilder('audit_logs')
        .select('group.name', 'group_name')
        .addSelect('user.full_name', 'user_name')
        .addSelect('user.email', 'user_email')
        .addSelect('user.createdAt', 'joined_date')
        .addSelect('COUNT(*)', 'engagement')
        .leftJoin('audit_logs.group', 'group')
        .leftJoin('audit_logs.user', 'user')
        .groupBy('group.name, user.full_name, user.createdAt, user.email')
        .where('audit_logs.organizationId = :organization_id', {
          organization_id,
        })
        .orderBy('engagement', 'DESC');
      const document_rankings_query = this.auditLogsRepository
        .createQueryBuilder('audit_logs')
        .select('group.name', 'group_name')
        .addSelect('file.name', 'file_name')
        .addSelect('file.id', 'id')
        .addSelect('file.mime_type', 'mime_type')
        .addSelect('folder.name', 'folder_name')
        .addSelect('COUNT(*)', 'views')
        .leftJoin('audit_logs.group', 'group')
        .leftJoin('audit_logs.file', 'file')
        .leftJoin('file.folder', 'folder')
        .groupBy('group.name, file.id, folder.name, file.mime_type')
        .where('audit_logs.organizationId = :organization_id', {
          organization_id,
        })
        .andWhere('audit_logs.type = :type', { type: 'view' })
        .orderBy('views', 'DESC');
      if (date.type == 'days' || date.type == 'months') {
        document_rankings_query.andWhere('audit_logs.createdAt >= :startDate', {
          startDate: formattedStartDate,
        });
        user_rankings_query.andWhere('audit_logs.createdAt >= :startDate', {
          startDate: formattedStartDate,
        });
        group_rankings_query.andWhere('audit_logs.createdAt >= :startDate', {
          startDate: formattedStartDate,
        });
      }
      const group_rankings = await group_rankings_query.getRawMany();
      const user_rankings = await user_rankings_query.limit(4).getRawMany();
      const document_rankings = await document_rankings_query.getRawMany();
      const createObjs = (
        name: string,
        group_data: any,
        document_data: any[],
        user_data: any[],
      ) => {
        return {
          group_name: name,
          ...group_data,
          documents: document_data,
          users: user_data,
        };
      };
      const data = [];
      group_rankings.map((group) => {
        const docs = [];
        const users = [];
        document_rankings.map((doc) => {
          if (doc.group_name == group.group_name && docs.length < 3) {
            delete doc.group_name;
            docs.push(doc);
          }
        });
        user_rankings.map((user) => {
          if (user.group_name == group.group_name) {
            delete user.group_name;
            users.push(user);
          }
        });
        data.push(createObjs(group.group_name, group, docs, users));
      });
      //sorting documnents
      data.forEach((data_item) => {
        data_item.documents.sort(
          (a, b) => parseInt(b.views) - parseInt(a.views),
        );
      });
      //sorting total
      data.sort((a, b) => parseInt(b.total) - parseInt(a.total));
      return { data };
    } catch (error) {
      console.log(error);
      throw Error(error);
    }
  }

  async findAll() {
    return await this.auditLogsRepository.find({ relations: ['user'] });
  }

  async findOne(id: string) {
    try {
      if (!id) throw new NotFoundException('Missing Fields');
      return await this.auditLogsRepository.findOne({
        where: { id },
        relations: ['users'],
      });
    } catch (error) {
      throw Error(error);
    }
  }

  async exportDataToExcel(organization_id: string) {
    if (!organization_id) throw new NotFoundException('Missing Fields');
    const audit_logs = await this.auditLogsRepository.find({
      relations: ['user', 'file'],
      where: { organization: { id: organization_id } },
    });
    const data = audit_logs
      ?.filter((log) => log.type === 'login')
      .map((item) => {
        return { user_name: item.user.full_name, created_at: item.createdAt };
      });
    const doc_data = audit_logs
      ?.filter((log) => log.type !== 'login')
      .map((item) => {
        return { doc_name: item.file.name, created_at: item.createdAt };
      });
    return { data, doc_data };
  }
}
