import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogs } from './entities/audit-logs.entities';
import { File } from 'src/files/entities/file.entity';
import { Organization } from 'src/organizations/entities/organization.entity';
import { User } from 'src/users/entities/user.entity';
import { createExcelWorkbook } from 'src/utils/excel.utils';
import { subMonths, format, subDays } from 'date-fns';
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
  ) {}

  async create(
    file_id: string | null,
    user_id: string,
    organization_id: string,
    type: string,
  ) {
    try {
      if (!user_id || !organization_id || !type)
        throw new NotFoundException('Missing Fields');
      const find_user = await this.userRepository.findOne({
        relations: ['groups', 'created_groups'],
        where: {
          id: user_id,
        },
      });
      const find_file = file_id
        ? await this.fileRepository.findOne({
            where: {
              is_deleted: false,
              id: file_id,
            },
          })
        : null;
      const find_org = await this.orgRepository.findOne({
        where: {
          id: organization_id,
        },
      });

      const groups = [...find_user.groups, ...find_user.created_groups];

      // console.log(groups, 'grrpppps')
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

  async getStats(organization_id: string, date: any) {
    try {
      // console.log(organization_id,'or isss')
      if (!organization_id || !date)
        throw new NotFoundException('Missing Fields');
      let startDate;
      if (date.type == 'days') {
        startDate = subDays(new Date(), date.value);
      } else if (date.type == 'months') {
        startDate = subMonths(new Date(), date.value);
      }
      const formattedStartDate = startDate && format(startDate, 'yyyy-MM-dd');

      console.log(formattedStartDate, 'date', date, '\n\n');

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

      if (date.type == 'days' || date.type == 'months') {
        group_rankings_query.andWhere('audit_logs.createdAt >= :startDate', {
          startDate: formattedStartDate,
        });
      }
      const group_rankings = await group_rankings_query.getRawMany();
      // console.log(group_rankings,'recordsss 1')
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

      if (date.type == 'days' || date.type == 'months') {
        user_rankings_query.where('audit_logs.createdAt >= :startDate', {
          startDate: formattedStartDate,
        });
      }
      const user_rankings = await user_rankings_query.limit(4).getRawMany();

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
        .andWhere('audit_logs.type = :type', {
          type: 'view',
        });

      if (date.type == 'days' || date.type == 'months') {
        document_rankings_query.where('audit_logs.createdAt >= :startDate', {
          startDate: formattedStartDate,
        });
      }
      const document_rankings = await document_rankings_query
        .limit(3)
        .getRawMany();

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
      // const totalSumTotal = group_rankings.reduce(
      //   (acc, cur) => acc + parseInt(cur.total),
      //   0,
      // );
      const data = [];
      group_rankings.map((group) => {
        const docs = [];
        const users = [];
        document_rankings.map((doc) => {
          if (doc.group_name == group.group_name) {
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
    return await this.auditLogsRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string) {
    try {
      if (!id) throw new NotFoundException('Missing Fields');
      return await this.auditLogsRepository.findOne({
        where: {
          id,
        },
        relations: ['users'],
      });
    } catch (error) {
      throw Error(error);
    }
  }

  async exportDataToExcel(organization_id: string) {
    if (!organization_id) throw new NotFoundException('Missing Fields');
    const audit_logs = await this.auditLogsRepository.find({
      relations: ['user'],
      where: {
        organization: {
          id: organization_id,
        },
      },
    });
    const data = audit_logs.map((item) => {
      return {
        user_name: item.user.full_name,
        created_at: item.createdAt,
      };
    });
    console.log(await createExcelWorkbook(data));
    // return await createExcelWorkbook(data);
  }
}
